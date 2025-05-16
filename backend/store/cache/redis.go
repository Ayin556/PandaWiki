package cache

import (
	"context"

	"github.com/redis/go-redis/v9"

	"github.com/chaitin/panda-wiki/config"
)

type Cache struct {
	*redis.Client
}

func NewCache(config *config.Config) (*Cache, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     config.Redis.Addr,
		Password: config.Redis.Password,
	})
	// test connection
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}
	return &Cache{
		Client: rdb,
	}, nil
}
