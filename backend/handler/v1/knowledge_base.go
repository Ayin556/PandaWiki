package v1

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
)

type KnowledgeBaseHandler struct {
	*handler.BaseHandler
	usecase    *usecase.KnowledgeBaseUsecase
	llmUsecase *usecase.LLMUsecase
	logger     *log.Logger
	auth       middleware.AuthMiddleware
}

func NewKnowledgeBaseHandler(
	baseHandler *handler.BaseHandler,
	echo *echo.Echo,
	usecase *usecase.KnowledgeBaseUsecase,
	llmUsecase *usecase.LLMUsecase,
	auth middleware.AuthMiddleware,
	logger *log.Logger,
) *KnowledgeBaseHandler {
	h := &KnowledgeBaseHandler{
		BaseHandler: baseHandler,
		logger:      logger.WithModule("handler.v1.knowledge_base"),
		usecase:     usecase,
		llmUsecase:  llmUsecase,
		auth:        auth,
	}

	group := echo.Group("/api/v1/knowledge_base", h.auth.Authorize)
	group.POST("", h.CreateKnowledgeBase)
	group.GET("/list", h.GetKnowledgeBaseList)
	group.GET("/detail", h.GetKnowledgeBaseDetail)
	group.PUT("/detail", h.UpdateKnowledgeBase)
	group.DELETE("/detail", h.DeleteKnowledgeBase)

	return h
}

// CreateKnowledgeBase
//
//	@Summary		CreateKnowledgeBase
//	@Description	CreateKnowledgeBase
//	@Tags			knowledge_base
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.CreateKnowledgeBaseReq	true	"CreateKnowledgeBase Request"
//	@Success		200		{object}	domain.Response
//	@Router			/api/v1/knowledge_base [post]
func (h *KnowledgeBaseHandler) CreateKnowledgeBase(c echo.Context) error {
	var req domain.CreateKnowledgeBaseReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	id := uuid.New().String()
	err := h.usecase.CreateKnowledgeBase(c.Request().Context(), &domain.KnowledgeBase{
		ID:   id,
		Name: req.Name,
	})
	if err != nil {
		return h.NewResponseWithError(c, "failed to create knowledge base", err)
	}

	return h.NewResponseWithData(c, map[string]string{
		"id": id,
	})
}

// GetKnowledgeBaseList
//
//	@Summary		GetKnowledgeBaseList
//	@Description	GetKnowledgeBaseList
//	@Tags			knowledge_base
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	domain.Response{data=[]domain.KnowledgeBaseListItem}
//	@Router			/api/v1/knowledge_base/list [get]
func (h *KnowledgeBaseHandler) GetKnowledgeBaseList(c echo.Context) error {
	knowledgeBases, err := h.usecase.GetKnowledgeBaseList(c.Request().Context())
	if err != nil {
		return h.NewResponseWithError(c, "failed to get knowledge base list", err)
	}

	return h.NewResponseWithData(c, knowledgeBases)
}

// UpdateKnowledgeBase
//
//	@Summary		UpdateKnowledgeBase
//	@Description	UpdateKnowledgeBase
//	@Tags			knowledge_base
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.UpdateKnowledgeBaseReq	true	"UpdateKnowledgeBase Request"
//	@Success		200		{object}	domain.Response
//	@Router			/api/v1/knowledge_base/detail [put]
func (h *KnowledgeBaseHandler) UpdateKnowledgeBase(c echo.Context) error {
	var req domain.UpdateKnowledgeBaseReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	err := h.usecase.UpdateKnowledgeBase(c.Request().Context(), &domain.KnowledgeBase{
		ID:   req.ID,
		Name: req.Name,
	})
	if err != nil {
		return h.NewResponseWithError(c, "failed to update knowledge base", err)
	}

	return h.NewResponseWithData(c, nil)
}

// GetKnowledgeBaseDetail
//
//	@Summary		GetKnowledgeBaseDetail
//	@Description	GetKnowledgeBaseDetail
//	@Tags			knowledge_base
//	@Accept			json
//	@Produce		json
//	@Param			id	query		string	true	"Knowledge Base ID"
//	@Success		200	{object}	domain.Response{data=domain.KnowledgeBaseDetail}
//	@Router			/api/v1/knowledge_base/detail [get]
func (h *KnowledgeBaseHandler) GetKnowledgeBaseDetail(c echo.Context) error {
	kbID := c.QueryParam("id")
	if kbID == "" {
		return h.NewResponseWithError(c, "kb id is required", nil)
	}

	kb, err := h.usecase.GetKnowledgeBase(c.Request().Context(), kbID)
	if err != nil {
		return h.NewResponseWithError(c, "failed to get knowledge base detail", err)
	}

	return h.NewResponseWithData(c, kb)
}

// DeleteKnowledgeBase
//
//	@Summary		DeleteKnowledgeBase
//	@Description	DeleteKnowledgeBase
//	@Tags			knowledge_base
//	@Accept			json
//	@Produce		json
//	@Param			id	query		string	true	"Knowledge Base ID"
//	@Success		200	{object}	domain.Response
//	@Router			/api/v1/knowledge_base/detail [delete]
func (h *KnowledgeBaseHandler) DeleteKnowledgeBase(c echo.Context) error {
	kbID := c.QueryParam("id")
	if kbID == "" {
		return h.NewResponseWithError(c, "kb id is required", nil)
	}

	err := h.usecase.DeleteKnowledgeBase(c.Request().Context(), kbID)
	if err != nil {
		return h.NewResponseWithError(c, "failed to delete knowledge base", err)
	}

	return h.NewResponseWithData(c, nil)
}
