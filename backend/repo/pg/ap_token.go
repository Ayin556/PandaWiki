package pg

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type APITokenRepo struct {
	db     *pg.DB
	logger *log.Logger
}

func NewAPITokenRepo(db *pg.DB, logger *log.Logger) *APITokenRepo {
	return &APITokenRepo{
		db:     db,
		logger: logger,
	}
}

func (r *APITokenRepo) GetByToken(ctx context.Context, token string) (*domain.APIToken, error) {
	var apiToken domain.APIToken
	if err := r.db.WithContext(ctx).Where("token = ?", token).First(&apiToken).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("get api token by token failed: %w", err)
	}
	return &apiToken, nil
}
