package cache

import (
	"context"

	"github.com/chaitin/panda-wiki/store/cache"
)

const geoKey = "geo"

type GeoRepo struct {
	cache *cache.Cache
}

func NewGeoRepo(cache *cache.Cache) *GeoRepo {
	return &GeoRepo{cache: cache}
}

func (r *GeoRepo) GetGeo(ctx context.Context, latlng []string) (map[string]string, error) {
	address, err := r.cache.HMGet(ctx, geoKey, latlng...).Result()
	if err != nil {
		return nil, err
	}
	addressMap := make(map[string]string)
	for i, item := range address {
		if item == nil {
			continue
		}
		addressMap[latlng[i]] = item.(string)
	}
	return addressMap, nil
}

func (r *GeoRepo) SetGeo(ctx context.Context, latlng string, address string) error {
	return r.cache.HSet(ctx, geoKey, latlng, address).Err()
}
