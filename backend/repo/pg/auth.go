package pg

import (
	"context"

	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type AuthRepo struct {
	db     *pg.DB
	logger *log.Logger
}

func NewAuthRepo(db *pg.DB, logger *log.Logger) *AuthRepo {
	return &AuthRepo{
		db:     db,
		logger: logger,
	}
}

func (r *AuthRepo) GetAuthUserinfoByIDs(ctx context.Context, authIDs []uint) (map[uint]*domain.AuthInfo, error) {
	if len(authIDs) == 0 {
		return nil, nil
	}

	var authUserInfo = []domain.AuthInfo{}
	err := r.db.WithContext(ctx).Table("auths").
		Select("id,user_info as auth_user_info").
		Where("id IN (?) ", authIDs).
		Find(&authUserInfo).Error
	if err != nil {
		return nil, err
	}
	//set map
	result := make(map[uint]*domain.AuthInfo, 0)
	for _, a := range authUserInfo {
		result[a.ID] = &a
	}
	return result, nil
}

func (r *AuthRepo) GetAuthGroupByAuthId(ctx context.Context, authID uint) ([]domain.AuthGroup, error) {
	authGroups := make([]domain.AuthGroup, 0)
	err := r.db.WithContext(ctx).Model(&domain.AuthGroup{}).
		Where("? = ANY(auth_ids)", authID).
		Find(&authGroups).Error
	if err != nil {
		return nil, err
	}

	return authGroups, nil
}

func (r *AuthRepo) GetAuthGroupIdsByAuthId(ctx context.Context, authID uint) ([]int, error) {
	groupIds := make([]int, 0)
	err := r.db.WithContext(ctx).Model(&domain.AuthGroup{}).
		Where("? = ANY(auth_ids)", authID).
		Pluck("id", &groupIds).Error
	if err != nil {
		return nil, err
	}

	return groupIds, nil
}

func (r *AuthRepo) GetAuthBySourceType(ctx context.Context, sourceType consts.SourceType) (*domain.Auth, error) {
	var auth *domain.Auth
	if err := r.db.WithContext(ctx).Model(&domain.Auth{}).Where("source_type = ?", string(sourceType)).First(&auth).Error; err != nil {
		return nil, err
	}
	return auth, nil
}

func (r *AuthRepo) CreateAuth(ctx context.Context, auth *domain.Auth) error {
	return r.db.WithContext(ctx).Model(&domain.Auth{}).Create(auth).Error
}

func (r *AuthRepo) DeleteAuthsBySourceType(ctx context.Context, kbID string, sourceType consts.SourceType) error {
	var authIDs []string

	if err := r.db.WithContext(ctx).
		Model(&domain.Auth{}).
		Where("kb_id = ? AND source_type = ?", kbID, string(sourceType)).
		Pluck("id", &authIDs).Error; err != nil {
		return err
	}

	if len(authIDs) == 0 {
		return nil
	}

	if err := r.db.WithContext(ctx).
		Where("id IN ?", authIDs).
		Delete(&domain.Auth{}).Error; err != nil {
		return err
	}

	for _, id := range authIDs {
		if err := r.db.WithContext(ctx).
			Model(&domain.AuthGroup{}).
			Where("kb_id = ?", kbID).
			Update("auth_ids", gorm.Expr("array_remove(auth_ids, ?)", id)).Error; err != nil {
			return err
		}
	}

	return nil
}
