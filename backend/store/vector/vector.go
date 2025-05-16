package vector

import (
	"context"
	"fmt"

	"github.com/google/wire"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/vector/embedding"
	"github.com/chaitin/panda-wiki/store/vector/qdrant"
)

type VectorStore interface {
	QueryRecords(ctx context.Context, kbIDs []string, query string) ([]*domain.DocChunk, error)
	UpsertRecords(ctx context.Context, chunks []*domain.DocChunk) error
	DeleteRecords(ctx context.Context, docIDs []string) error
	DeleteKnowledgeBase(ctx context.Context, kbID string) error
}

func NewVectorStore(config *config.Config, logger *log.Logger, embedding embedding.Embedding) (VectorStore, error) {
	switch config.Vector.Provider {
	case "qdrant":
		return qdrant.NewQdrantCloud(config, logger, embedding)
	default:
		return nil, fmt.Errorf("unsupported vector provider: %s", config.Vector.Provider)
	}
}

var ProviderSet = wire.NewSet(embedding.NewEmbedding, NewVectorStore)
