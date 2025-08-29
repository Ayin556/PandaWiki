package usecase

import (
	"context"

	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type AuthUsecase struct {
	AuthRepo *pg.AuthRepo
	logger   *log.Logger
}

func NewAuthUsecase(authRepo *pg.AuthRepo, logger *log.Logger) (*AuthUsecase, error) {
	u := &AuthUsecase{
		AuthRepo: authRepo,
		logger:   logger.WithModule("usecase.auth"),
	}
	return u, nil
}

func (u *AuthUsecase) GetAuthBySourceType(ctx context.Context, sourceType consts.SourceType) (*domain.Auth, error) {
	return u.AuthRepo.GetAuthBySourceType(ctx, sourceType)
}
