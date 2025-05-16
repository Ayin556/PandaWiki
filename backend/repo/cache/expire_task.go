package cache

import (
	"context"
	"math/rand"
	"time"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/store/cache"
)

type ExpireTaskRepo struct {
	cache *cache.Cache
}

func NewExpireTaskRepo(cache *cache.Cache) *ExpireTaskRepo {
	return &ExpireTaskRepo{cache: cache}
}

func (r *ExpireTaskRepo) SetDocScrapeRequestExpireTask(ctx context.Context, docIDs []string) error {
	for _, docID := range docIDs {
		expireTime := domain.ScraperResultExpireTime + time.Duration(rand.Intn(1200))*time.Second
		if err := r.cache.SetEx(ctx, domain.DocScrapeRequestExpireKey(docID), "", expireTime).Err(); err != nil {
			return err
		}
	}
	return r.cache.SAdd(ctx, domain.AllScraperResultExpireKey, docIDs).Err()
}

func (r *ExpireTaskRepo) CheckDocScrapeRequestExpireKeys(ctx context.Context) ([]string, error) {
	allDocScrapeRequestExpireKeys, err := r.cache.SMembers(ctx, domain.AllScraperResultExpireKey).Result()
	if err != nil {
		return nil, err
	}
	expiredDocIDs := make([]string, 0)
	for _, docID := range allDocScrapeRequestExpireKeys {
		expireTime, err := r.cache.TTL(ctx, domain.DocScrapeRequestExpireKey(docID)).Result()
		if err != nil {
			return nil, err
		}
		if expireTime <= 0 {
			if err := r.cache.Del(ctx, domain.DocScrapeRequestExpireKey(docID)).Err(); err != nil {
				return nil, err
			}
			if err := r.cache.SRem(ctx, domain.AllScraperResultExpireKey, docID).Err(); err != nil {
				return nil, err
			}
			expiredDocIDs = append(expiredDocIDs, docID)
		}
	}
	return expiredDocIDs, nil
}
