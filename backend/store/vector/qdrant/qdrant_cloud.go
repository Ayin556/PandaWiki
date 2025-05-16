package qdrant

import (
	"context"
	"fmt"

	"github.com/qdrant/go-client/qdrant"
	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/vector/embedding"
)

type QdrantCloud struct {
	client     *qdrant.Client
	logger     *log.Logger
	embedding  embedding.Embedding
	collection string
	queryTopK  int
	rerankTopK int
}

func NewQdrantCloud(config *config.Config, logger *log.Logger, embedding embedding.Embedding) (*QdrantCloud, error) {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:                   config.Vector.Qdrant.Host,
		Port:                   config.Vector.Qdrant.Port,
		APIKey:                 config.Vector.Qdrant.APIKey,
		UseTLS:                 false,
		SkipCompatibilityCheck: true,
	})
	if err != nil {
		return nil, err
	}

	exists, err := client.CollectionExists(context.Background(), config.Vector.Qdrant.Collection)
	if err != nil {
		return nil, err
	}
	if !exists {
		// create collection if not exists
		if err := client.CreateCollection(context.Background(), &qdrant.CreateCollection{
			CollectionName: config.Vector.Qdrant.Collection,
			VectorsConfig: &qdrant.VectorsConfig{
				Config: &qdrant.VectorsConfig_Params{
					Params: &qdrant.VectorParams{
						Size:     1024,
						Distance: qdrant.Distance_Cosine,
					},
				},
			},
		}); err != nil {
			return nil, err
		}
	}
	return &QdrantCloud{
		client:     client,
		logger:     logger.WithModule("qdrant_cloud"),
		collection: config.Vector.Qdrant.Collection,
		embedding:  embedding,
		queryTopK:  config.Vector.QueryTopK,
		rerankTopK: config.Embedding.RerankTopK,
	}, nil
}

func (q *QdrantCloud) QueryRecords(ctx context.Context, kbIDs []string, query string) ([]*domain.DocChunk, error) {
	embeddings, err := q.embedding.Embed([]string{query}, true)
	if err != nil {
		return nil, fmt.Errorf("error embedding query: %w", err)
	}
	var limit uint64 = uint64(q.queryTopK)
	results, err := q.client.Query(ctx, &qdrant.QueryPoints{
		CollectionName: q.collection,
		Query: qdrant.NewQuery(lo.Map(embeddings[0], func(v float64, _ int) float32 {
			return float32(v)
		})...),
		WithPayload: qdrant.NewWithPayload(true),
		Limit:       &limit,
		Filter: &qdrant.Filter{
			Must: []*qdrant.Condition{
				qdrant.NewMatchKeywords("kb_id", kbIDs...),
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("error querying records: %w", err)
	}
	if len(results) > 0 {
		chunks := lo.Map(results, func(point *qdrant.ScoredPoint, _ int) *domain.DocChunk {
			return &domain.DocChunk{
				ID:      point.Id.String(),
				Content: point.Payload["content"].GetStringValue(),
				Title:   point.Payload["title"].GetStringValue(),
				URL:     point.Payload["url"].GetStringValue(),
				Seq:     uint(point.Payload["seq"].GetIntegerValue()),
				DocID:   point.Payload["doc_id"].GetStringValue(),
				KBID:    point.Payload["kb_id"].GetStringValue(),
			}
		})
		q.logger.Debug(
			"search result chunks",
			log.Any("len", len(chunks)),
			log.Any("chunk_doc_ids", lo.Uniq(lo.Map(chunks, func(chunk *domain.DocChunk, _ int) string {
				return chunk.DocID
			}))),
		)
		// rerank
		indices, scores, err := q.embedding.Rerank(query, lo.Map(chunks, func(chunk *domain.DocChunk, _ int) string {
			return fmt.Sprintf("%s %s", chunk.Title, chunk.Content)
		}), q.rerankTopK)
		if err != nil {
			return nil, fmt.Errorf("error reranking: %w", err)
		}
		q.logger.Debug("rerank result", log.Any("indices", indices), log.Any("scores", scores))
		rerankedContents := lo.Map(indices, func(index int, _ int) *domain.DocChunk {
			return chunks[index]
		})
		q.logger.Debug("reranked contents", log.Any("len", len(rerankedContents)), log.Any("rerankedContents", lo.Map(rerankedContents, func(chunk *domain.DocChunk, _ int) string {
			return chunk.DocID
		})))
		return rerankedContents, nil
	}
	return nil, nil
}

func (q *QdrantCloud) UpsertRecords(ctx context.Context, docChunks []*domain.DocChunk) error {
	for _, chunks := range lo.Chunk(docChunks, 64) {
		// get embedding
		embeddings, err := q.embedding.Embed(lo.Map(chunks, func(chunk *domain.DocChunk, _ int) string {
			return chunk.Content
		}), false)
		if err != nil {
			return fmt.Errorf("error embedding chunks: %w", err)
		}
		q.logger.Debug("embedding result", log.Any("embeddings_count", len(embeddings)))
		points := make([]*qdrant.PointStruct, len(chunks))
		for i, chunk := range chunks {
			points[i] = &qdrant.PointStruct{
				Id: qdrant.NewID(chunk.ID),
				Vectors: qdrant.NewVectors(lo.Map(embeddings[i], func(v float64, _ int) float32 {
					return float32(v)
				})...),
				Payload: qdrant.NewValueMap(map[string]any{
					"content": chunk.Content,
					"title":   chunk.Title,
					"url":     chunk.URL,
					"seq":     chunk.Seq,
					"doc_id":  chunk.DocID,
					"kb_id":   chunk.KBID,
				}),
			}
		}
		if _, err := q.client.Upsert(ctx, &qdrant.UpsertPoints{
			CollectionName: q.collection,
			Points:         points,
		}); err != nil {
			return fmt.Errorf("error upserting chunks: %w", err)
		}
	}
	return nil
}

func (q *QdrantCloud) DeleteRecords(ctx context.Context, docIDs []string) error {
	if _, err := q.client.Delete(ctx, &qdrant.DeletePoints{
		CollectionName: q.collection,
		Points: qdrant.NewPointsSelectorFilter(
			&qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatchKeywords("doc_id", docIDs...),
				},
			},
		),
	}); err != nil {
		return err
	}
	return nil
}

func (q *QdrantCloud) DeleteKnowledgeBase(ctx context.Context, kbID string) error {
	if _, err := q.client.Delete(ctx, &qdrant.DeletePoints{
		CollectionName: q.collection,
		Points: qdrant.NewPointsSelectorFilter(
			&qdrant.Filter{
				Must: []*qdrant.Condition{
					qdrant.NewMatchKeywords("kb_id", kbID),
				},
			},
		),
	}); err != nil {
		return err
	}
	return nil
}
