package pg

import (
	"context"

	"github.com/samber/lo"

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

// getAllAuthGroupsAsMap fetches all auth groups and returns them as a map for quick lookup
func (r *AuthRepo) getAllAuthGroupsAsMap(ctx context.Context) (map[uint]*domain.AuthGroup, error) {
	var allGroups []domain.AuthGroup
	err := r.db.WithContext(ctx).Find(&allGroups).Error
	if err != nil {
		return nil, err
	}

	groupMap := lo.SliceToMap(allGroups, func(group domain.AuthGroup) (uint, *domain.AuthGroup) {
		return group.ID, &group
	})

	return groupMap, nil
}

// getAuthGroupsWithParentsByAuthId is a helper method that retrieves user's auth groups and all parent groups
func (r *AuthRepo) getAuthGroupsWithParentsByAuthId(ctx context.Context, authID uint) (map[uint]domain.AuthGroup, error) {
	// Get user's direct auth groups
	var directGroups []domain.AuthGroup
	err := r.db.WithContext(ctx).Model(&domain.AuthGroup{}).
		Where("? = ANY(auth_ids)", authID).
		Find(&directGroups).Error
	if err != nil {
		return nil, err
	}

	if len(directGroups) == 0 {
		return make(map[uint]domain.AuthGroup), nil
	}

	groupMap, err := r.getAllAuthGroupsAsMap(ctx)
	if err != nil {
		return nil, err
	}

	resultGroups := make(map[uint]domain.AuthGroup)
	visited := make(map[uint]bool)

	var findParents func(uint)
	findParents = func(groupID uint) {
		if visited[groupID] {
			return // Avoid circular reference
		}
		visited[groupID] = true

		group, exists := groupMap[groupID]
		if !exists {
			return // Group not found, end search
		}

		resultGroups[group.ID] = *group

		if group.ParentID != nil {
			findParents(*group.ParentID)
		}
	}

	// Process user's direct groups and their parent groups
	for _, group := range directGroups {
		resultGroups[group.ID] = group
		if group.ParentID != nil {
			findParents(*group.ParentID)
		}
	}

	return resultGroups, nil
}

// GetAuthGroupWithParentsByAuthId retrieves user's auth groups and all parent groups as slice
func (r *AuthRepo) GetAuthGroupWithParentsByAuthId(ctx context.Context, authID uint) ([]domain.AuthGroup, error) {
	groupsMap, err := r.getAuthGroupsWithParentsByAuthId(ctx, authID)
	if err != nil {
		return nil, err
	}

	result := make([]domain.AuthGroup, 0, len(groupsMap))
	for _, group := range groupsMap {
		result = append(result, group)
	}

	return result, nil
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

// GetAuthGroupIdsWithParentsByAuthId retrieves user's auth group IDs and all parent group IDs (for permission inheritance)
func (r *AuthRepo) GetAuthGroupIdsWithParentsByAuthId(ctx context.Context, authID uint) ([]int, error) {
	groupsMap, err := r.getAuthGroupsWithParentsByAuthId(ctx, authID)
	if err != nil {
		return nil, err
	}

	result := make([]int, 0, len(groupsMap))
	for _, group := range groupsMap {
		result = append(result, int(group.ID))
	}

	return result, nil
}

func (r *AuthRepo) GetAuthBySourceType(ctx context.Context, sourceType consts.SourceType) (*domain.Auth, error) {
	var auth *domain.Auth
	if err := r.db.WithContext(ctx).Model(&domain.Auth{}).Where("source_type = ?", string(sourceType)).First(&auth).Error; err != nil {
		return nil, err
	}
	return auth, nil
}

func (r *AuthRepo) GetAuthByKBIDAndSourceType(ctx context.Context, kbID string, sourceType consts.SourceType) (*domain.Auth, error) {
	var auth *domain.Auth
	if err := r.db.WithContext(ctx).Model(&domain.Auth{}).Where("kb_id = ? AND source_type = ?", kbID, string(sourceType)).First(&auth).Error; err != nil {
		return nil, err
	}
	return auth, nil
}

func (r *AuthRepo) CreateAuth(ctx context.Context, auth *domain.Auth) error {
	return r.db.WithContext(ctx).Model(&domain.Auth{}).Create(auth).Error
}
