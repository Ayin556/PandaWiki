package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type UserUsecase struct {
	repo   *pg.UserRepository
	logger *log.Logger
	config *config.Config
}

func NewUserUsecase(repo *pg.UserRepository, logger *log.Logger, config *config.Config) (*UserUsecase, error) {
	if config.AdminPassword != "" {
		if err := repo.UpsertDefaultUser(context.Background(), &domain.User{
			ID:       uuid.New().String(),
			Account:  "admin",
			Password: config.AdminPassword,
		}); err != nil {
			return nil, fmt.Errorf("failed to create default user: %w", err)
		}
	}
	return &UserUsecase{
		repo:   repo,
		logger: logger.WithModule("usecase.user"),
		config: config,
	}, nil
}

func (u *UserUsecase) CreateUser(ctx context.Context, user *domain.User) error {
	return u.repo.CreateUser(ctx, user)
}

func (u *UserUsecase) VerifyUserAndGenerateToken(ctx context.Context, req domain.LoginReq) (string, error) {
	var user *domain.User
	var err error
	user, err = u.repo.VerifyUser(ctx, req.Account, req.Password)
	if err != nil {
		return "", err
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":  user.ID,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
	})

	return token.SignedString([]byte(u.config.Auth.JWT.Secret))
}

func (u *UserUsecase) GetUser(ctx context.Context, userID string) (*domain.UserInfoResp, error) {
	user, err := u.repo.GetUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &domain.UserInfoResp{
		ID:        user.ID,
		Account:   user.Account,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (u *UserUsecase) ListUsers(ctx context.Context) ([]*domain.UserListItemResp, error) {
	return u.repo.ListUsers(ctx)
}

func (u *UserUsecase) ResetPassword(ctx context.Context, req *domain.ResetPasswordReq) error {
	return u.repo.UpdateUserPassword(ctx, req.ID, req.NewPassword)
}
