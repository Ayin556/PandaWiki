package usecase

import (
	"context"

	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/vector"
)

type KnowledgeBaseUsecase struct {
	repo   *pg.KnowledgeBaseRepository
	vector vector.VectorStore
	logger *log.Logger
}

func NewKnowledgeBaseUsecase(repo *pg.KnowledgeBaseRepository, vector vector.VectorStore, logger *log.Logger) *KnowledgeBaseUsecase {
	u := &KnowledgeBaseUsecase{
		repo:   repo,
		vector: vector,
		logger: logger.WithModule("usecase.knowledge_base"),
	}
	if err := u.CreateDefaultKnowledgeBase(context.Background()); err != nil {
		logger.Error("failed to create default knowledge base", "error", err)
	}
	return u
}

// create default knowledge base
func (u *KnowledgeBaseUsecase) CreateDefaultKnowledgeBase(ctx context.Context) error {
	return u.repo.CreateDefaultKnowledgeBaseWithApps(ctx, &domain.KnowledgeBase{
		ID:   "default",
		Name: "默认知识库",
	})
}

func (u *KnowledgeBaseUsecase) CreateKnowledgeBase(ctx context.Context, kb *domain.KnowledgeBase) error {
	return u.repo.CreateKnowledgeBase(ctx, kb)
}

func (u *KnowledgeBaseUsecase) GetKnowledgeBaseList(ctx context.Context) ([]*domain.KnowledgeBaseListItem, error) {
	knowledgeBases, err := u.repo.GetKnowledgeBaseList(ctx)
	if err != nil {
		return nil, err
	}
	kbIDs := lo.Map(knowledgeBases, func(kb *domain.KnowledgeBaseListItem, _ int) string {
		return kb.ID
	})
	if len(kbIDs) > 0 {
		stats, err := u.repo.GetKBStatsByIDs(ctx, kbIDs)
		if err != nil {
			return nil, err
		}
		for _, kb := range knowledgeBases {
			if stat, ok := stats[kb.ID]; ok {
				kb.Stats = *stat
			}
		}
	}
	return knowledgeBases, nil
}

func (u *KnowledgeBaseUsecase) UpdateKnowledgeBase(ctx context.Context, kb *domain.KnowledgeBase) error {
	return u.repo.UpdateKnowledgeBase(ctx, kb)
}

func (u *KnowledgeBaseUsecase) GetKnowledgeBase(ctx context.Context, kbID string) (*domain.KnowledgeBase, error) {
	return u.repo.GetKnowledgeBaseByID(ctx, kbID)
}

func (u *KnowledgeBaseUsecase) DeleteKnowledgeBase(ctx context.Context, kbID string) error {
	if err := u.repo.DeleteKnowledgeBase(ctx, kbID); err != nil {
		return err
	}
	// delete vector store
	if err := u.vector.DeleteKnowledgeBase(ctx, kbID); err != nil {
		return err
	}
	return nil
}
