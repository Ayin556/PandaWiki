package usecase

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"slices"
	"time"

	"github.com/cloudwego/eino-ext/components/model/openai"
	"github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/components/prompt"
	"github.com/cloudwego/eino/schema"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/vector"
	"github.com/chaitin/panda-wiki/utils"
)

type LLMUsecase struct {
	vector           vector.VectorStore
	conversationRepo *pg.ConversationRepository
	config           *config.Config
	logger           *log.Logger
}

func NewLLMUsecase(config *config.Config, vector vector.VectorStore, conversationRepo *pg.ConversationRepository, logger *log.Logger) *LLMUsecase {
	return &LLMUsecase{
		config:           config,
		vector:           vector,
		conversationRepo: conversationRepo,
		logger:           logger.WithModule("llm_usecase"),
	}
}

func (u *LLMUsecase) GetChatModel(ctx context.Context, model *domain.Model) (model.ChatModel, error) {
	// config chat model
	var temprature float32 = 0.0
	config := &openai.ChatModelConfig{
		APIKey:      model.APIKey,
		BaseURL:     model.BaseURL,
		Model:       string(model.Model),
		Temperature: &temprature,
	}
	if model.Provider == domain.ModelProviderBrandAzureOpenAI {
		config.ByAzure = true
		config.APIVersion = model.APIVersion
		if config.APIVersion == "" {
			config.APIVersion = "2024-10-21"
		}
	}
	if model.APIHeader != "" {
		client := getHttpClientWithAPIHeaderMap(model.APIHeader)
		if client != nil {
			config.HTTPClient = client
		}
	}
	chatModel, err := openai.NewChatModel(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create chat model failed: %w", err)
	}
	return chatModel, nil
}

func (u *LLMUsecase) FormatKBMessage(ctx context.Context, kbIDs []string, messages []*domain.ChatToKBMessage) ([]*schema.Message, error) {
	kbMessages := make([]*schema.Message, 0)
	for _, msg := range messages {
		switch msg.Role {
		case "user":
			kbMessages = append(kbMessages, schema.UserMessage(msg.Content))
		case "assistant":
			kbMessages = append(kbMessages, schema.AssistantMessage(msg.Content, nil))
		default:
			continue
		}
	}
	if len(kbMessages) > 0 {
		question := kbMessages[len(kbMessages)-1].Content
		// get related documents from vectordb
		records, err := u.vector.QueryRecords(ctx, kbIDs, question)
		if err != nil {
			return nil, fmt.Errorf("get vector failed: %w", err)
		}
		documents := domain.FormatDocChunks(records)

		template := prompt.FromMessages(schema.GoTemplate,
			schema.SystemMessage(domain.SystemPrompt),
			schema.UserMessage(domain.UserQuestionFormatter),
		)
		formattedMessages, err := template.Format(ctx, map[string]any{
			"CurrentDate": time.Now().Format("2006-01-02"),
			"Question":    question,
			"Documents":   documents,
		})
		if err != nil {
			return nil, fmt.Errorf("format messages failed: %w", err)
		}
		kbMessages = slices.Insert(formattedMessages, 1, kbMessages[:len(kbMessages)-1]...)
	}
	return kbMessages, nil
}

func (u *LLMUsecase) FormatConversationMessages(
	ctx context.Context,
	conversationID string,
	kbID string,
) ([]*schema.Message, error) {
	messages := make([]*schema.Message, 0)

	msgs, err := u.conversationRepo.GetConversationMessagesByID(ctx, conversationID)
	if err != nil {
		return nil, fmt.Errorf("get conversation messages failed: %w", err)
	}
	if len(msgs) > 0 {
		historyMessages := make([]*schema.Message, 0)
		for _, msg := range msgs {
			switch msg.Role {
			case schema.Assistant:
				historyMessages = append(historyMessages, schema.AssistantMessage(msg.Content, nil))
			case schema.User:
				historyMessages = append(historyMessages, schema.UserMessage(msg.Content))
			default:
				continue
			}
		}
		if len(historyMessages) > 0 {
			question := historyMessages[len(historyMessages)-1].Content

			template := prompt.FromMessages(schema.GoTemplate,
				schema.SystemMessage(domain.SystemPrompt),
				schema.UserMessage(domain.UserQuestionFormatter),
			)
			// get related documents from vectordb
			records, err := u.vector.QueryRecords(ctx, []string{kbID}, question)
			if err != nil {
				return nil, fmt.Errorf("get vector failed: %w", err)
			}
			documents := domain.FormatDocChunks(records)

			formattedMessages, err := template.Format(ctx, map[string]any{
				"CurrentDate": time.Now().Format("2006-01-02"),
				"Question":    question,
				"Documents":   documents,
			})
			if err != nil {
				return nil, fmt.Errorf("format messages failed: %w", err)
			}
			messages = slices.Insert(formattedMessages, 1, historyMessages[:len(historyMessages)-1]...)
		}
	}
	return messages, nil
}

func (u *LLMUsecase) ChatWithAgent(
	ctx context.Context,
	chatModel model.ChatModel,
	messages []*schema.Message,
	usage *schema.TokenUsage,
	onChunk func(ctx context.Context, dataType, chunk string) error,
) error {
	resp, err := chatModel.Stream(ctx, messages)
	if err != nil {
		return fmt.Errorf("stream failed: %w", err)
	}

	for {
		msg, err := resp.Recv()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("recv failed: %w", err)
		}
		if err := onChunk(ctx, "data", msg.Content); err != nil {
			return fmt.Errorf("on chunk data: %w", err)
		}

		// set to usage
		if msg.ResponseMeta.Usage != nil {
			*usage = *msg.ResponseMeta.Usage
		}
	}

	return nil
}

func (u *LLMUsecase) CheckModel(ctx context.Context, req *domain.CheckModelReq) (*domain.CheckModelResp, error) {
	checkResp := &domain.CheckModelResp{}
	config := &openai.ChatModelConfig{
		APIKey:  req.APIKey,
		BaseURL: req.BaseURL,
		Model:   string(req.Model),
	}
	// for azure openai
	if req.Provider == domain.ModelProviderBrandAzureOpenAI {
		config.ByAzure = true
		config.APIVersion = req.APIVersion
		if config.APIVersion == "" {
			config.APIVersion = "2024-10-21"
		}
	}
	if req.APIHeader != "" {
		client := getHttpClientWithAPIHeaderMap(req.APIHeader)
		if client != nil {
			config.HTTPClient = client
		}
	}
	chatModel, err := openai.NewChatModel(ctx, config)
	if err != nil {
		checkResp.Error = err.Error()
		return checkResp, nil
	}
	resp, err := chatModel.Generate(ctx, []*schema.Message{
		schema.SystemMessage("You are a helpful assistant."),
		schema.UserMessage("hi"),
	})
	if err != nil {
		checkResp.Error = err.Error()
		return checkResp, nil
	}
	content := resp.Content
	if content == "" {
		checkResp.Error = "generate failed"
		return checkResp, nil
	}
	checkResp.Content = content
	return checkResp, nil
}

type headerTransport struct {
	headers map[string]string
	base    http.RoundTripper
}

func (t *headerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	for k, v := range t.headers {
		req.Header.Set(k, v)
	}
	return t.base.RoundTrip(req)
}

func getHttpClientWithAPIHeaderMap(header string) *http.Client {
	headerMap := utils.GetHeaderMap(header)
	if len(headerMap) > 0 {
		// create http client with custom transport for headers
		client := &http.Client{
			Timeout: 0,
		}
		// Wrap the transport to add headers
		client.Transport = &headerTransport{
			headers: headerMap,
			base:    http.DefaultTransport,
		}
		return client
	}
	return nil
}
