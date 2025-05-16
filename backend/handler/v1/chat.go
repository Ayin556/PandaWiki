package v1

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
)

type ChatHandler struct {
	*handler.BaseHandler
	appUsecase          *usecase.AppUsecase
	llmUsecase          *usecase.LLMUsecase
	conversationUsecase *usecase.ConversationUsecase
	modelUsecase        *usecase.ModelUsecase
	config              *config.Config
	auth                middleware.AuthMiddleware
	logger              *log.Logger
}

func NewChatHandler(
	e *echo.Echo,
	baseHandler *handler.BaseHandler,
	logger *log.Logger,
	auth middleware.AuthMiddleware,
	appUsecase *usecase.AppUsecase,
	llmUsecase *usecase.LLMUsecase,
	conversationUsecase *usecase.ConversationUsecase,
	modelUsecase *usecase.ModelUsecase,
	config *config.Config,
) *ChatHandler {
	h := &ChatHandler{
		BaseHandler:         baseHandler,
		auth:                auth,
		appUsecase:          appUsecase,
		llmUsecase:          llmUsecase,
		conversationUsecase: conversationUsecase,
		modelUsecase:        modelUsecase,
		config:              config,
		logger:              logger.WithModule("handler.v1.chat"),
	}
	api := e.Group("/api/v1/chat", h.auth.Authorize)
	api.POST("/kb", h.ChatToKB)

	share := e.Group("share/v1/chat", func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Access-Control-Allow-Origin", "*")
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Content-Type, Origin, Accept")
			if c.Request().Method == "OPTIONS" {
				return c.NoContent(http.StatusOK)
			}
			return next(c)
		}
	})
	share.POST("/message", h.ChatMessage)
	return h
}

type sseEvent struct {
	Type    string `json:"type"`
	Content string `json:"content"`
	Error   string `json:"error,omitempty"`
}

// ChatMessage chat message
//
//	@Summary		ChatMessage
//	@Description	ChatMessage
//	@Tags			chat
//	@Accept			json
//	@Produce		json
//	@Param			app_id	query		string				true	"app id"
//	@Param			request	body		domain.ChatRequest	true	"request"
//	@Success		200		{object}	domain.Response
//	@Router			/share/v1/chat/message [post]
func (h *ChatHandler) ChatMessage(c echo.Context) error {
	// 设置 SSE headers
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("Transfer-Encoding", "chunked")
	defer func() {
		h.writeSSEEvent(c, sseEvent{Type: "done", Content: ""})
	}()

	// 1. validate chat request
	chatRequest, err := h.prepareChatRequest(c)
	if err != nil {
		return h.sendErrMsg(c, err.Error())
	}
	// 2. get and validate model
	model, err := h.getAndValidateModel(c.Request().Context())
	if err != nil {
		return h.sendErrMsg(c, err.Error())
	}

	// 3. validate chat session
	err = h.handleChatSession(c, chatRequest)
	if err != nil {
		return h.sendErrMsg(c, err.Error())
	}

	// 4. execute chat
	return h.executeChatAndRespond(c, chatRequest, model)
}

// prepareChatRequest prepare chat request
func (h *ChatHandler) prepareChatRequest(c echo.Context) (*domain.ChatRequest, error) {
	appID := c.QueryParam("app_id")
	if appID == "" {
		return nil, fmt.Errorf("app_id is required")
	}

	chatRequest := domain.ChatRequest{}
	if err := c.Bind(&chatRequest); err != nil {
		return nil, err
	}
	if err := c.Validate(&chatRequest); err != nil {
		return nil, err
	}

	appDetail, err := h.appUsecase.GetAppDetail(c.Request().Context(), appID)
	if err != nil {
		h.logger.Error("failed to get app detail", log.Error(err))
		return nil, fmt.Errorf("app not found")
	}

	chatRequest.RemoteIP = c.RealIP()
	chatRequest.KBID = appDetail.KBID
	chatRequest.AppID = appID
	chatRequest.AppType = appDetail.Type

	return &chatRequest, nil
}

func (h *ChatHandler) sendErrMsg(c echo.Context, errMsg string) error {
	return h.writeSSEEvent(c, sseEvent{Type: "error", Content: errMsg})
}

// handleChatSession handle chat session
func (h *ChatHandler) handleChatSession(c echo.Context, req *domain.ChatRequest) error {
	if req.ConversationID == "" {
		// new conversation
		id, err := uuid.NewV7()
		if err != nil {
			h.logger.Error("failed to generate conversation uuid", log.Error(err))
			id = uuid.New()
		}
		conversationID := id.String()

		// set conversation info
		req.ConversationID = conversationID
		nonce := uuid.New().String()

		// send conversation id
		if err := h.sendSessionInfo(c, conversationID, nonce); err != nil {
			return err
		}

		// create new chat conversation
		if err := h.conversationUsecase.CreateConversation(c.Request().Context(), &domain.Conversation{
			ID:        conversationID,
			Nonce:     nonce,
			AppID:     c.QueryParam("app_id"),
			KBID:      req.KBID,
			Subject:   req.Message,
			RemoteIP:  req.RemoteIP,
			CreatedAt: time.Now(),
		}); err != nil {
			h.logger.Error("failed to create chat conversation", log.Error(err))
			return fmt.Errorf("failed to create chat conversation")
		}

		return nil
	}

	// validate existing conversation
	conversationID := req.ConversationID
	if req.Nonce == "" {
		return fmt.Errorf("nonce is required")
	}

	err := h.conversationUsecase.ValidateConversationNonce(c.Request().Context(), conversationID, req.Nonce)
	if err != nil {
		h.logger.Error("failed to validate chat conversation nonce", log.Error(err))
		return fmt.Errorf("validate chat conversation nonce failed")
	}

	return nil
}

// sendSessionInfo send session info to client
func (h *ChatHandler) sendSessionInfo(c echo.Context, conversationID, nonce string) error {
	if err := h.writeSSEEvent(c, sseEvent{
		Type:    "conversation_id",
		Content: conversationID,
	}); err != nil {
		return fmt.Errorf("failed to send conversation id: %w", err)
	}

	if err := h.writeSSEEvent(c, sseEvent{
		Type:    "nonce",
		Content: nonce,
	}); err != nil {
		return fmt.Errorf("failed to send nonce: %w", err)
	}

	return nil
}

// getAndValidateModel get and validate model
func (h *ChatHandler) getAndValidateModel(ctx context.Context) (*domain.Model, error) {
	model, err := h.modelUsecase.GetInUseModel(ctx)
	if err != nil {
		h.logger.Error("failed to get model", log.Error(err))
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("请前往管理后台，点击右上角的“系统设置”配置推理大模型。")
		}
		return nil, fmt.Errorf("failed to get model")
	}

	return model, nil
}

// executeChatAndRespond execute chat and respond
func (h *ChatHandler) executeChatAndRespond(c echo.Context, req *domain.ChatRequest, model *domain.Model) error {
	errChan := make(chan error, 1)
	req.ModelInfo = model

	go func() {
		answer := ""
		ctx := c.Request().Context()
		usage := schema.TokenUsage{}

		// save user question
		if err := h.conversationUsecase.CreateChatConversationMessage(ctx, req.KBID, &domain.ConversationMessage{
			ID:             uuid.New().String(),
			ConversationID: req.ConversationID,
			AppID:          req.AppID,
			Role:           schema.User,
			Content:        req.Message,

			RemoteIP: req.RemoteIP,
		}); err != nil {
			h.logger.Error("failed to create conversation message", log.Error(err))
		}

		chatModel, err := h.llmUsecase.GetChatModel(ctx, model)
		if err != nil {
			h.logger.Error("failed to get chat model", log.Error(err))
			errChan <- fmt.Errorf("failed to get chat model")
			return
		}
		messages, err := h.llmUsecase.FormatConversationMessages(ctx, req.ConversationID, req.KBID)
		if err != nil {
			h.logger.Error("failed to format chat messages", log.Error(err))
			errChan <- fmt.Errorf("failed to format chat messages")
			return
		}

		chatErr := h.llmUsecase.ChatWithAgent(ctx, chatModel, messages, &usage, func(ctx context.Context, dataType, chunk string) error {
			answer += chunk
			return h.writeSSEEvent(c, sseEvent{Type: dataType, Content: chunk})
		})

		// save answer message
		if err := h.conversationUsecase.CreateChatConversationMessage(ctx, req.KBID, &domain.ConversationMessage{
			ID:             uuid.New().String(),
			ConversationID: req.ConversationID,
			AppID:          req.AppID,

			Role:    schema.Assistant,
			Content: answer,

			Provider:         model.Provider,
			Model:            string(model.Model),
			PromptTokens:     usage.PromptTokens,
			CompletionTokens: usage.CompletionTokens,
			TotalTokens:      usage.TotalTokens,

			RemoteIP: req.RemoteIP,
		}); err != nil {
			h.logger.Error("failed to create conversation", log.Error(err))
		}
		// update model token usage
		if err := h.modelUsecase.UpdateUsage(ctx, model.ID, &usage); err != nil {
			h.logger.Error("failed to update model token usage", log.Error(err))
		}

		errChan <- chatErr
	}()

	if err := <-errChan; err != nil {
		h.logger.Error("对话失败", log.Error(err))
		return h.sendErrMsg(c, "对话失败，请稍后再试")
	}

	return nil
}

func (h *ChatHandler) writeSSEEvent(c echo.Context, data any) error {
	jsonContent, err := json.Marshal(data)
	if err != nil {
		return err
	}

	sseMessage := fmt.Sprintf("data: %s\n\n", string(jsonContent))
	if _, err := c.Response().Write([]byte(sseMessage)); err != nil {
		return err
	}
	c.Response().Flush()
	return nil
}

// ChatToKB
//
//	@Summary		ChatToKB
//	@Description	ChatToKB
//	@Tags			chat
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.ChatToKBReq	true	"ChatToKBReq Request"
//	@Success		200		{object}	domain.Response
//	@Router			/api/v1/chat/kb [post]
func (h *ChatHandler) ChatToKB(c echo.Context) error {
	var req domain.ChatToKBReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}
	// 设置 SSE headers
	c.Response().Header().Set("Content-Type", "text/event-stream")
	c.Response().Header().Set("Cache-Control", "no-cache")
	c.Response().Header().Set("Connection", "keep-alive")
	c.Response().Header().Set("Transfer-Encoding", "chunked")
	defer func() {
		h.writeSSEEvent(c, sseEvent{Type: "done", Content: ""})
	}()

	errChan := make(chan error, 1)

	ctx := c.Request().Context()
	model, err := h.getAndValidateModel(ctx)
	if err != nil {
		h.logger.Error("failed to get model", log.Error(err))
		return h.NewResponseWithError(c, "failed to get model", err)
	}

	go func() {
		chatModel, err := h.llmUsecase.GetChatModel(ctx, model)
		if err != nil {
			h.logger.Error("failed to get chat model", log.Error(err))
			errChan <- fmt.Errorf("failed to get chat model")
			return
		}
		messages, err := h.llmUsecase.FormatKBMessage(ctx, []string{req.KBID}, req.Messages)
		if err != nil {
			h.logger.Error("failed to format chat messages", log.Error(err))
			errChan <- fmt.Errorf("failed to format chat messages")
			return
		}

		usage := schema.TokenUsage{}
		chatErr := h.llmUsecase.ChatWithAgent(ctx, chatModel, messages, &usage, func(ctx context.Context, dataType, chunk string) error {
			return h.writeSSEEvent(c, sseEvent{Type: dataType, Content: chunk})
		})
		errChan <- chatErr
	}()

	if err := <-errChan; err != nil {
		h.logger.Error("对话失败", log.Error(err))
		return h.sendErrMsg(c, "对话失败，请稍后再试")
	}

	return nil
}
