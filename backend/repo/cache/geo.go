package cache

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/cache"
)

type GeoRepo struct {
	cache  *cache.Cache
	logger *log.Logger
}

func NewGeoCache(cache *cache.Cache, logger *log.Logger) *GeoRepo {
	return &GeoRepo{
		cache:  cache,
		logger: logger.WithModule("repo.cache.geo"),
	}
}

func (r *GeoRepo) SetGeo(ctx context.Context, kbID, field string) error {
	now := time.Now()
	key := fmt.Sprintf("geo:%s:%s", kbID, now.Format("2006-01-02-15"))

	// First try to increment the field
	result := r.cache.HIncrBy(ctx, key, field, 1)
	if result.Err() != nil {
		return result.Err()
	}

	// If this is the first increment (value = 1), set expire
	if result.Val() == 1 {
		return r.cache.Expire(ctx, key, 25*time.Hour).Err()
	}

	return nil
}

func (r *GeoRepo) GetLast24HourGeo(ctx context.Context, kbID string) (map[string]int64, error) {
	counts := make(map[string]int64)
	now := time.Now()

	// Get data for the last 24 hours
	for i := 0; i < 24; i++ {
		targetTime := now.Add(-time.Duration(i) * time.Hour)
		key := fmt.Sprintf("geo:%s:%s", kbID, targetTime.Format("2006-01-02-15"))

		values, err := r.cache.HGetAll(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("get geo count failed: %w", err)
		}

		for field, value := range values {
			valueInt, err := strconv.ParseInt(value, 10, 64)
			if err != nil {
				return nil, fmt.Errorf("parse geo count failed: %w", err)
			}
			counts[field] += valueInt
		}
	}
	return counts, nil
}
