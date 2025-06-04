package usecase

import (
	"context"

	"github.com/google/uuid"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/rag"
)

type KnowledgeBaseUsecase struct {
	repo   *pg.KnowledgeBaseRepository
	rag    rag.RAGService
	logger *log.Logger
	config *config.Config
}

func NewKnowledgeBaseUsecase(repo *pg.KnowledgeBaseRepository, rag rag.RAGService, logger *log.Logger, config *config.Config) (*KnowledgeBaseUsecase, error) {
	u := &KnowledgeBaseUsecase{
		repo:   repo,
		rag:    rag,
		logger: logger.WithModule("usecase.knowledge_base"),
		config: config,
	}
	return u, nil
}

func (u *KnowledgeBaseUsecase) CreateKnowledgeBase(ctx context.Context, req *domain.CreateKnowledgeBaseReq) (string, error) {
	// create kb in vector store
	datasetID, err := u.rag.CreateKnowledgeBase(ctx)
	if err != nil {
		return "", err
	}
	kbID := uuid.New().String()
	kb := &domain.KnowledgeBase{
		ID:        kbID,
		Name:      req.Name,
		DatasetID: datasetID,
		AccessSettings: domain.AccessSettings{
			Ports:      req.Ports,
			SSLPorts:   req.SSLPorts,
			PublicKey:  req.PublicKey,
			PrivateKey: req.PrivateKey,
			Hosts:      req.Hosts,
		},
	}
	if err := u.repo.CreateKnowledgeBase(ctx, kb); err != nil {
		return "", err
	}
	return kbID, nil
}

func (u *KnowledgeBaseUsecase) GetKnowledgeBaseList(ctx context.Context) ([]*domain.KnowledgeBaseListItem, error) {
	knowledgeBases, err := u.repo.GetKnowledgeBaseList(ctx)
	if err != nil {
		return nil, err
	}
	return knowledgeBases, nil
}

func (u *KnowledgeBaseUsecase) UpdateKnowledgeBase(ctx context.Context, req *domain.UpdateKnowledgeBaseReq) error {
	if err := u.repo.UpdateKnowledgeBase(ctx, req); err != nil {
		return err
	}
	return nil
}

func (u *KnowledgeBaseUsecase) GetKnowledgeBase(ctx context.Context, kbID string) (*domain.KnowledgeBase, error) {
	return u.repo.GetKnowledgeBaseByID(ctx, kbID)
}

func (u *KnowledgeBaseUsecase) DeleteKnowledgeBase(ctx context.Context, kbID string) error {
	if err := u.repo.DeleteKnowledgeBase(ctx, kbID); err != nil {
		return err
	}
	// delete vector store
	if err := u.rag.DeleteKnowledgeBase(ctx, kbID); err != nil {
		return err
	}
	return nil
}
