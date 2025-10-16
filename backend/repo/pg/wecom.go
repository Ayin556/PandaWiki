package pg

import (
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type WecomRepository struct {
	db     *pg.DB
	logger *log.Logger
}

func NewWecomRepository(db *pg.DB, logger *log.Logger) *WecomRepository {
	return &WecomRepository{db: db, logger: logger.WithModule("repo.pg.wecom")}
}

//
//func (r *WecomRepository) GetWecomStatic(ctx context.Context, kbID string, appType domain.AppType) (*domain.WecomStatic, error) {
//	var wecomStatic domain.WecomStatic
//	if err := r.db.WithContext(ctx).Model(&domain.App{}).
//		Where("kb_id = ? AND type = ?", kbID, appType).
//		Joins("join knowledge_bases kb on kb.id = kb_id ").
//		Select("apps.settings ->>'icon' as image_path", "kb.access_settings ->>'base_url' as base_url").
//		Find(&wecomStatic).Error; err != nil {
//		return nil, err
//	}
//	return &wecomStatic, nil
//}
//
//func (r *WecomRepository) GetWecomBaseURL(ctx context.Context, kbID string) (string, error) {
//	var baseUrl string
//	if err := r.db.WithContext(ctx).Model(&domain.KnowledgeBase{}).
//		Where("id = ?", kbID).
//		Select("access_settings ->>'base_url'").
//		First(&baseUrl).Error; err != nil {
//		return "", err
//	}
//	return baseUrl, nil
//}
