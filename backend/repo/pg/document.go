package pg

import (
	"context"
	"time"

	"github.com/samber/lo"
	"gorm.io/gorm/clause"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type DocRepository struct {
	db     *pg.DB
	logger *log.Logger
}

func NewDocRepository(db *pg.DB, logger *log.Logger) *DocRepository {
	return &DocRepository{db: db, logger: logger.WithModule("repo.pg.doc")}
}

func (r *DocRepository) Create(ctx context.Context, docs []*domain.Document) (map[string]struct{}, error) {
	// create in batch
	// return ids on conflict do nothing
	batchSize := 1000
	createdDocsMap := make(map[string]struct{})
	for _, docBatch := range lo.Chunk(docs, batchSize) {
		err := r.db.WithContext(ctx).
			Clauses(
				clause.OnConflict{
					Columns:   []clause.Column{{Name: "kb_id"}, {Name: "url"}},
					DoNothing: true,
				},
				clause.Returning{
					Columns: []clause.Column{{Name: "id"}},
				},
			).Create(docBatch).Error
		if err != nil {
			return nil, err
		}
		for _, doc := range docBatch {
			createdDocsMap[doc.ID] = struct{}{}
		}
	}
	return createdDocsMap, nil
}

func (r *DocRepository) Upsert(ctx context.Context, docs *domain.Document) error {
	return r.db.WithContext(ctx).Clauses(
		clause.OnConflict{
			Columns:   []clause.Column{{Name: "kb_id"}, {Name: "url"}},
			DoUpdates: clause.AssignmentColumns([]string{"status", "updated_at"}),
		},
		clause.Returning{
			Columns: []clause.Column{{Name: "id"}},
		},
	).Create(docs).Error
}

func (r *DocRepository) GetList(ctx context.Context, req *domain.GetDocListReq) ([]*domain.DocListItemResp, error) {
	var documents []*domain.DocListItemResp
	query := r.db.WithContext(ctx).
		Model(&domain.Document{}).
		Where("documents.kb_id = ?", req.KBID).
		Select("documents.id, documents.url, documents.source, documents.resource_type, documents.status, documents.error, documents.meta->>'title' as title, documents.meta->>'favicon' as favicon, length(documents.content) as word_count, documents.created_at, documents.updated_at")
	if req.Search != "" {
		searchPattern := "%" + req.Search + "%"
		query = query.Where("documents.meta->>'title' LIKE ? OR documents.content LIKE ?", searchPattern, searchPattern)
	}
	query = query.Order("documents.updated_at desc")
	if err := query.Find(&documents).Error; err != nil {
		return nil, err
	}
	return documents, nil
}

func (r *DocRepository) GetDocChunkCountByDocIDs(ctx context.Context, docIDs []string) (map[string]uint, error) {
	// process in batch
	const batchSize = 1000
	docChunkCountMap := make(map[string]uint)
	for _, docIDs := range lo.Chunk(docIDs, batchSize) {
		var docChunkCounts []*struct {
			DocID string `json:"doc_id"`
			Count uint   `json:"count"`
		}
		// group by doc_id count
		if err := r.db.WithContext(ctx).Model(&domain.DocChunk{}).
			Where("doc_id IN ?", docIDs).
			Group("doc_id").
			Select("doc_id, COUNT(*) as count").
			Find(&docChunkCounts).Error; err != nil {
			return nil, err
		}
		for _, docChunkCount := range docChunkCounts {
			docChunkCountMap[docChunkCount.DocID] = docChunkCount.Count
		}
	}
	return docChunkCountMap, nil
}

func (r *DocRepository) GetByID(ctx context.Context, documentID string) (*domain.DocDetailResp, error) {
	var document *domain.DocDetailResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Document{}).
		Where("id = ?", documentID).
		First(&document).Error; err != nil {
		return nil, err
	}
	return document, nil
}

func (r *DocRepository) UpdateDocContent(ctx context.Context, document *domain.Document) error {
	return r.db.WithContext(ctx).Model(&domain.Document{}).
		Where("id = ?", document.ID).
		Updates(map[string]any{
			"resource_type": document.ResourceType,
			"status":        document.Status,
			"error":         document.Error,
			"content":       document.Content,
			"meta":          document.Meta,
			"updated_at":    time.Now(),
		}).Error
}

func (r *DocRepository) UpdatekDocStatus(ctx context.Context, documentIDs []string, preStatus []domain.DocStatus, status domain.DocStatus) (map[string]struct{}, error) {
	const batchSize = 1000
	updatedIDsMap := make(map[string]struct{})

	// process in batch
	for i := 0; i < len(documentIDs); i += batchSize {
		end := i + batchSize
		if end > len(documentIDs) {
			end = len(documentIDs)
		}

		var updatedIDs []domain.Document
		err := r.db.WithContext(ctx).Model(&updatedIDs).
			Omit("updated_at").
			Clauses(clause.Returning{Columns: []clause.Column{{Name: "id"}}}).
			Where("id IN ?", documentIDs[i:end]).
			Where("status IN ?", preStatus).
			Updates(map[string]any{
				"status": status,
			}).
			Error
		if err != nil {
			return nil, err
		}

		// merge results
		for _, doc := range updatedIDs {
			updatedIDsMap[doc.ID] = struct{}{}
		}

		r.logger.Debug("batch update progress",
			log.Int("batch", i/batchSize+1),
			log.Int("updated_in_batch", len(updatedIDs)),
			log.Int("total_updated", len(updatedIDsMap)),
		)
	}

	return updatedIDsMap, nil
}

func (r *DocRepository) Delete(ctx context.Context, docIDs []string) error {
	// delete in batch
	const batchSize = 1000
	for _, docIDs := range lo.Chunk(docIDs, batchSize) {
		if err := r.db.WithContext(ctx).
			Model(&domain.Document{}).
			Where("id IN ?", docIDs).
			Delete(&domain.Document{}).Error; err != nil {
			return err
		}
		if err := r.db.WithContext(ctx).
			Model(&domain.DocChunk{}).
			Where("doc_id IN ?", docIDs).
			Delete(&domain.DocChunk{}).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *DocRepository) GetDocContentByIDs(ctx context.Context, docIDs []string) (map[string]*domain.DocContent, error) {
	const batchSize = 1000
	docIDContentsMap := make(map[string]*domain.DocContent)
	for _, docIDs := range lo.Chunk(docIDs, batchSize) {
		var docIDContents []*domain.DocContent
		if err := r.db.WithContext(ctx).Model(&domain.Document{}).Where("id IN ?", docIDs).Select("id, kb_id, url, source, meta->>'title' as title, content").Find(&docIDContents).Error; err != nil {
			return nil, err
		}
		for _, docIDContent := range docIDContents {
			docIDContentsMap[docIDContent.ID] = docIDContent
		}
	}
	return docIDContentsMap, nil
}

func (r *DocRepository) GetDocsByURLs(ctx context.Context, kbID string, urls []string) (map[string]*domain.DocDetailResp, error) {
	var docs []*domain.DocDetailResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Document{}).
		Where("kb_id = ? AND url IN ?", kbID, urls).
		Select("id, url, meta").
		Find(&docs).Error; err != nil {
		return nil, err
	}
	docsMap := make(map[string]*domain.DocDetailResp)
	for _, doc := range docs {
		docsMap[doc.URL] = doc
	}
	return docsMap, nil
}

func (r *DocRepository) ManualUpdateDoc(ctx context.Context, req *domain.UpdateDocReq) error {
	updateMap := map[string]any{
		"status":     domain.DocStatusPending,
		"updated_at": time.Now(),
	}
	if req.Title != nil {
		updateMap["meta"] = domain.DocMeta{
			Title: *req.Title,
		}
	}
	if req.Content != nil {
		updateMap["content"] = *req.Content
	}
	return r.db.WithContext(ctx).
		Model(&domain.Document{}).
		Where("id = ?", req.DocID).
		Updates(updateMap).Error
}

func (r *DocRepository) CreateDocChunks(ctx context.Context, docIDs []string, docChunks []*domain.DocChunk) error {
	// delete old chunks
	if err := r.db.WithContext(ctx).Where("doc_id IN ?", docIDs).Delete(&domain.DocChunk{}).Error; err != nil {
		return err
	}
	// create new chunks
	return r.db.WithContext(ctx).CreateInBatches(docChunks, 1000).Error
}

func (r *DocRepository) GetChunkList(ctx context.Context, docID string) ([]*domain.ChunkListItemResp, error) {
	var chunks []*domain.ChunkListItemResp
	if err := r.db.WithContext(ctx).
		Model(&domain.DocChunk{}).
		Where("doc_id = ?", docID).
		Order("seq ASC").
		Find(&chunks).Error; err != nil {
		return nil, err
	}
	return chunks, nil
}

// GetDocListByDocIDs get doc list by ids
func (r *DocRepository) GetDocListByDocIDs(ctx context.Context, docIDs []string) ([]*domain.RecommandDocListResp, error) {
	var docs []*domain.RecommandDocListResp
	if err := r.db.WithContext(ctx).
		Model(&domain.Document{}).
		Where("id IN ?", docIDs).
		Select("id, url, meta->>'title' as title, substr(content, 1, 100) as summary").
		Find(&docs).Error; err != nil {
		return nil, err
	}
	return docs, nil
}
