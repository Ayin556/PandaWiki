package usecase

import (
	"context"
	"time"

	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/s3"
)

type DocUsecase struct {
	docRepo    *pg.DocRepository
	crawlRepo  *mq.CrawlRepository
	vectorRepo *mq.VectorRepository
	logger     *log.Logger
	s3Client   *s3.MinioClient
}

func NewDocUsecase(docRepo *pg.DocRepository, crawlRepo *mq.CrawlRepository, vectorRepo *mq.VectorRepository, logger *log.Logger, s3Client *s3.MinioClient) *DocUsecase {
	return &DocUsecase{
		docRepo:    docRepo,
		crawlRepo:  crawlRepo,
		vectorRepo: vectorRepo,
		logger:     logger,
		s3Client:   s3Client,
	}
}

func (u *DocUsecase) Create(ctx context.Context, docs []*domain.Document) (map[string]struct{}, error) {
	docIDs, err := u.docRepo.Create(ctx, docs)
	if err != nil {
		return nil, err
	}
	// send scrape request to mq
	docDetailRequests := make([]*domain.DocScrapeRequest, 0)
	createTimestamp := time.Now().Unix()
	for _, doc := range docs {
		if _, ok := docIDs[doc.ID]; !ok {
			continue
		}
		url := doc.URL
		if doc.Source == domain.DocSourceFile {
			url, err = u.s3Client.SignURL(ctx, domain.Bucket, doc.URL, 1*time.Hour)
			if err != nil {
				return nil, err
			}
		} else if doc.Source == domain.DocSourceManual {
			// upsert vector content for manual doc
			docVectorContentRequests := []*domain.DocVectorContentRequest{
				{
					DocIDs: []string{doc.ID},
					Action: "upsert",
				},
			}
			if err := u.vectorRepo.UpdateRecords(ctx, docVectorContentRequests); err != nil {
				return nil, err
			}
			continue
		}
		docID := doc.ID
		request := &domain.DocScrapeRequest{
			Meta: domain.Meta{
				PageID:          docID,
				CreateTimestamp: createTimestamp,
			},
			Body: struct {
				URL string `json:"url"`
			}{
				URL: url,
			},
		}
		docDetailRequests = append(docDetailRequests, request)
	}
	if len(docDetailRequests) > 0 {
		err := u.crawlRepo.ScrapeDocs(ctx, docDetailRequests)
		if err != nil {
			return nil, err
		}
	}
	return docIDs, nil
}

func (u *DocUsecase) GetList(ctx context.Context, req *domain.GetDocListReq) ([]*domain.DocListItemResp, error) {
	docs, err := u.docRepo.GetList(ctx, req)
	if err != nil {
		return nil, err
	}
	// get doc chunk_count by doc_ids
	docChunkCountMap, err := u.docRepo.GetDocChunkCountByDocIDs(ctx, lo.Map(docs, func(doc *domain.DocListItemResp, _ int) string {
		return doc.ID
	}))
	if err != nil {
		return nil, err
	}
	// merge docChunkCounts to docs
	for _, doc := range docs {
		doc.ChunkCount = docChunkCountMap[doc.ID]
	}

	return docs, nil
}

func (u *DocUsecase) GetByID(ctx context.Context, docID string) (*domain.DocDetailResp, error) {
	return u.docRepo.GetByID(ctx, docID)
}

func (u *DocUsecase) DocAction(ctx context.Context, docIDs []string, action string) error {
	switch action {
	case "delete":
		if err := u.docRepo.Delete(ctx, docIDs); err != nil {
			return err
		}
		// async delete vector records
		batchSize := 20
		docVectorContentRequests := make([]*domain.DocVectorContentRequest, 0)
		for _, chunk := range lo.Chunk(docIDs, batchSize) {
			docVectorContentRequests = append(docVectorContentRequests, &domain.DocVectorContentRequest{
				DocIDs: chunk,
				Action: "delete",
			})
		}
		if len(docVectorContentRequests) > 0 {
			if err := u.vectorRepo.UpdateRecords(ctx, docVectorContentRequests); err != nil {
				return err
			}
		}
	}
	return nil
}

func (u *DocUsecase) Update(ctx context.Context, req *domain.UpdateDocReq) error {
	if err := u.docRepo.ManualUpdateDoc(ctx, req); err != nil {
		return err
	}
	// async upsert vector content
	docVectorContentRequests := []*domain.DocVectorContentRequest{
		{
			DocIDs: []string{req.DocID},
			Action: "upsert",
		},
	}
	if err := u.vectorRepo.UpdateRecords(ctx, docVectorContentRequests); err != nil {
		return err
	}
	return nil
}

func (u *DocUsecase) GetChunkList(ctx context.Context, docID string) ([]*domain.ChunkListItemResp, error) {
	chunks, err := u.docRepo.GetChunkList(ctx, docID)
	if err != nil {
		return nil, err
	}
	return chunks, nil
}
