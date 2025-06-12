package usecase

import (
	"context"
	"fmt"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/cloudwego/eino/schema"
)

type CreationUsecase struct {
	llm    *LLMUsecase
	model  *ModelUsecase
	logger *log.Logger
}

func NewCreationUsecase(logger *log.Logger, llm *LLMUsecase, model *ModelUsecase) *CreationUsecase {
	return &CreationUsecase{
		llm:    llm,
		model:  model,
		logger: logger.WithModule("usecase.creation"),
	}
}

func (u *CreationUsecase) TextCreation(ctx context.Context, req *domain.TextReq, onChunk func(ctx context.Context, dataType, chunk string) error) error {
	model, err := u.model.GetChatModel(ctx)
	if err != nil {
		u.logger.Error("get chat model failed", log.Error(err))
		return domain.ErrModelNotConfigured
	}
	chatModel, err := u.llm.GetChatModel(ctx, model)
	if err != nil {
		return fmt.Errorf("get chat model failed: %w", err)
	}
	messages := []*schema.Message{
		{
			Role:    "system",
			Content: "Improve writing in the following text, return the updated text only",
		},
		{
			Role:    "user",
			Content: req.Text,
		},
	}
	usage := &schema.TokenUsage{}
	err = u.llm.ChatWithAgent(ctx, chatModel, messages, usage, onChunk)
	if err != nil {
		return fmt.Errorf("chat with llm failed: %w", err)
	}
	return nil
}
