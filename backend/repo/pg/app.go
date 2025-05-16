package pg

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/store/pg"
)

type AppRepository struct {
	db *pg.DB
}

func NewAppRepository(db *pg.DB) *AppRepository {
	return &AppRepository{db: db}
}

func (r *AppRepository) CreateApp(ctx context.Context, req *domain.App) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *AppRepository) GetAppDetail(ctx context.Context, id string) (*domain.App, error) {
	app := &domain.App{}
	if err := r.db.WithContext(ctx).
		Model(&domain.App{}).
		Where("id = ?", id).
		First(app).Error; err != nil {
		return nil, err
	}
	return app, nil
}

func (r *AppRepository) GetAppList(ctx context.Context, kbID string) ([]*domain.AppListItem, error) {
	apps := []*domain.AppListItem{}
	if err := r.db.WithContext(ctx).
		Model(&domain.App{}).
		Where("kb_id=?", kbID).
		Order("created_at ASC").
		Find(&apps).Error; err != nil {
		return nil, err
	}
	return apps, nil
}

func (r *AppRepository) UpdateApp(ctx context.Context, id string, appRequest *domain.UpdateAppReq) error {
	updateMap := map[string]any{}
	if appRequest.Name != nil {
		updateMap["name"] = appRequest.Name
	}
	if appRequest.Settings != nil {
		updateMap["settings"] = appRequest.Settings
	}
	return r.db.WithContext(ctx).Model(&domain.App{}).Where("id = ?", id).Updates(updateMap).Error
}

func (r *AppRepository) GetAppByLink(ctx context.Context, link string) (*domain.AppDetailResp, error) {
	app := &domain.AppDetailResp{}
	if err := r.db.WithContext(ctx).
		Model(&domain.App{}).
		Where("link = ?", link).
		First(app).Error; err != nil {
		return nil, err
	}
	return app, nil
}

func (r *AppRepository) DeleteApp(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.App{}, "id = ?", id).Error
}
