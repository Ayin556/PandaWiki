package middleware

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
)

type APITokenRepository interface {
	GetByToken(ctx context.Context, token string) (*domain.APIToken, error)
}
