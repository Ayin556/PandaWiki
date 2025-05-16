package mq

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/mq"
	"github.com/chaitin/panda-wiki/mq/types"
	"github.com/chaitin/panda-wiki/repo/cache"
	mqRepo "github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type DocMQHandler struct {
	consumer   mq.MQConsumer
	repo       *pg.DocRepository
	cacheRepo  *cache.ExpireTaskRepo
	vectorRepo *mqRepo.VectorRepository
	logger     *log.Logger
}

func NewDocMQHandler(consumer mq.MQConsumer, repo *pg.DocRepository, cacheRepo *cache.ExpireTaskRepo, vectorRepo *mqRepo.VectorRepository, logger *log.Logger) (*DocMQHandler, error) {
	h := &DocMQHandler{
		consumer:   consumer,
		repo:       repo,
		cacheRepo:  cacheRepo,
		vectorRepo: vectorRepo,
		logger:     logger.WithModule("handler.mq.document"),
	}
	if err := h.consumer.RegisterHandler(domain.ScraperResponseTopic, h.HandleDocDetailResult); err != nil {
		return nil, err
	}
	// check doc scrape request expire keys
	go func() {
		for {
			time.Sleep(time.Second * 10)
			expiredDocIDs, err := h.cacheRepo.CheckDocScrapeRequestExpireKeys(context.Background())
			if err != nil {
				h.logger.Error("check doc scrape request expire keys failed", log.Any("error", err))
				continue
			}
			if len(expiredDocIDs) > 0 {
				h.logger.Info("expired doc scrape request", log.Any("doc_ids", expiredDocIDs))
				// update doc status to failed
				_, err = h.repo.UpdatekDocStatus(context.Background(), expiredDocIDs, []domain.DocStatus{domain.DocStatusPending}, domain.DocStatusFailed)
				if err != nil {
					h.logger.Error("update doc status to failed failed", log.Any("error", err))
					continue
				}
			}
		}
	}()
	return h, nil
}

func (h *DocMQHandler) HandleDocDetailResult(ctx context.Context, msg types.Message) error {
	var detail domain.DocScrapeResult
	err := json.Unmarshal(msg.GetData(), &detail)
	if err != nil {
		h.logger.Error("unmarshal doc detail result failed", log.Any("error", err))
		return nil
	}
	h.logger.Debug("handle doc detail result", log.Any("kb_id", detail.Meta.KBID), log.Any("doc_id", detail.Meta.PageID))
	meta := domain.DocMeta{
		Title:       detail.Data.Title,
		Description: detail.Data.Description,
		Keywords:    strings.Join(detail.Data.Keywords, ","),
		Favicon:     detail.Data.Favicon,
		Charset:     detail.Data.Charset,
		DocType:     detail.Data.ResourceType,
		Screenshot:  detail.Data.Screenshot,
	}
	status := domain.DocStatusPublished
	if detail.Err != 0 {
		status = domain.DocStatusFailed
	}
	content := &domain.Document{
		ID:     detail.Meta.PageID,
		URL:    detail.Data.EntryURL,
		Status: status,
		Error:  detail.MSG,

		Meta:         meta,
		Content:      detail.Data.Markdown,
		ResourceType: detail.Data.ResourceType,
	}
	err = h.repo.UpdateDocContent(ctx, content)
	if err != nil {
		h.logger.Error("insert doc detail result failed", log.Any("error", err))
		return err
	}
	// update vector
	vectorRequest := &domain.DocVectorContentRequest{
		DocIDs: []string{detail.Meta.PageID},
		Action: "upsert",
	}
	if err := h.vectorRepo.UpdateRecords(ctx, []*domain.DocVectorContentRequest{vectorRequest}); err != nil {
		h.logger.Error("update vector failed", log.Any("error", err))
		return nil
	}
	return nil
}
