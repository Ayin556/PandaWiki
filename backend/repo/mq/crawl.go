package mq

import (
	"context"
	"encoding/json"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/mq"
	"github.com/chaitin/panda-wiki/repo/cache"
)

type CrawlRepository struct {
	producer  mq.MQProducer
	cacheRepo *cache.ExpireTaskRepo
	logger    *log.Logger
}

func NewCrawlRepository(producer mq.MQProducer, cacheRepo *cache.ExpireTaskRepo, logger *log.Logger) *CrawlRepository {
	return &CrawlRepository{producer: producer, cacheRepo: cacheRepo, logger: logger.WithModule("mq.crawl")}
}

func (r *CrawlRepository) ScrapeDocs(ctx context.Context, requests []*domain.DocScrapeRequest) error {
	ids := make([]string, 0)
	for _, request := range requests {
		requestBytes, err := json.Marshal(request)
		if err != nil {
			return err
		}
		if err := r.producer.Produce(ctx, domain.ScraperRequestTopic, request.Meta.PageID, requestBytes); err != nil {
			return err
		}
		ids = append(ids, request.Meta.PageID)
	}
	if err := r.cacheRepo.SetDocScrapeRequestExpireTask(ctx, ids); err != nil {
		return err
	}
	return nil
}
