package pg

import (
	"context"
	"crypto/md5"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/store/pg"
)

type KnowledgeBaseRepository struct {
	db *pg.DB
}

func NewKnowledgeBaseRepository(db *pg.DB) *KnowledgeBaseRepository {
	return &KnowledgeBaseRepository{
		db: db,
	}
}

func (r *KnowledgeBaseRepository) CreateDefaultKnowledgeBaseWithApps(ctx context.Context, kb *domain.KnowledgeBase) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// check if there is a knowledge base exists
		var count int64
		if err := tx.Model(&domain.KnowledgeBase{}).
			Where("id = ?", kb.ID).
			Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return nil
		}

		if err := tx.Create(kb).Error; err != nil {
			return err
		}
		if err := tx.Create(&domain.App{
			ID:       uuid.New().String(),
			KBID:     kb.ID,
			Name:     kb.Name,
			Type:     domain.AppTypeWeb,
			Link:     fmt.Sprintf("%x", md5.Sum([]byte(uuid.New().String()))),
			Settings: domain.AppSettings{},
		}).Error; err != nil {
			return err
		}
		if err := tx.Create(&domain.App{
			ID:       uuid.New().String(),
			KBID:     kb.ID,
			Name:     kb.Name,
			Type:     domain.AppTypeWidget,
			Link:     fmt.Sprintf("%x", md5.Sum([]byte(uuid.New().String()))),
			Settings: domain.AppSettings{},
		}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *KnowledgeBaseRepository) CreateKnowledgeBase(ctx context.Context, kb *domain.KnowledgeBase) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(kb).Error; err != nil {
			return err
		}
		if err := tx.Create(&domain.App{
			ID:       uuid.New().String(),
			KBID:     kb.ID,
			Name:     kb.Name,
			Type:     domain.AppTypeWeb,
			Link:     fmt.Sprintf("%x", md5.Sum([]byte(uuid.New().String()))),
			Settings: domain.AppSettings{},
		}).Error; err != nil {
			return err
		}
		if err := tx.Create(&domain.App{
			ID:       uuid.New().String(),
			KBID:     kb.ID,
			Name:     kb.Name,
			Type:     domain.AppTypeWidget,
			Link:     fmt.Sprintf("%x", md5.Sum([]byte(uuid.New().String()))),
			Settings: domain.AppSettings{},
		}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *KnowledgeBaseRepository) GetKnowledgeBaseList(ctx context.Context) ([]*domain.KnowledgeBaseListItem, error) {
	var kbs []*domain.KnowledgeBaseListItem
	if err := r.db.WithContext(ctx).Model(&domain.KnowledgeBase{}).Find(&kbs).Error; err != nil {
		return nil, err
	}
	return kbs, nil
}

func (r *KnowledgeBaseRepository) UpdateKnowledgeBase(ctx context.Context, kb *domain.KnowledgeBase) error {
	return r.db.WithContext(ctx).Model(&domain.KnowledgeBase{}).Where("id = ?", kb.ID).Updates(kb).Error
}

func (r *KnowledgeBaseRepository) GetKnowledgeBaseByID(ctx context.Context, kbID string) (*domain.KnowledgeBase, error) {
	var kb domain.KnowledgeBase
	if err := r.db.WithContext(ctx).Where("id = ?", kbID).First(&kb).Error; err != nil {
		return nil, err
	}
	return &kb, nil
}

func (r *KnowledgeBaseRepository) GetKBStatsByIDs(ctx context.Context, kbIDs []string) (map[string]*domain.KBStats, error) {
	stats := make(map[string]*domain.KBStats)

	// get doc count and word count
	var docStats []*domain.KBStats
	if err := r.db.WithContext(ctx).
		Model(&domain.Document{}).
		Where("kb_id IN ?", kbIDs).
		Select("kb_id, COUNT(id) as doc_count, SUM(LENGTH(content)) as word_count").
		Group("kb_id").
		Find(&docStats).Error; err != nil {
		return nil, err
	}

	// get chunk count
	var chunkStats []*domain.KBStats
	if err := r.db.WithContext(ctx).
		Model(&domain.DocChunk{}).
		Where("kb_id IN ?", kbIDs).
		Select("kb_id, COUNT(id) as chunk_count").
		Group("kb_id").
		Find(&chunkStats).Error; err != nil {
		return nil, err
	}

	// merge results
	for _, stat := range docStats {
		stats[stat.KBID] = stat
	}
	for _, stat := range chunkStats {
		if existing, ok := stats[stat.KBID]; ok {
			existing.ChunkCount = stat.ChunkCount
		}
	}

	return stats, nil
}

func (r *KnowledgeBaseRepository) DeleteKnowledgeBase(ctx context.Context, kbID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("kb_id = ?", kbID).Delete(&domain.Document{}).Error; err != nil {
			return err
		}
		if err := tx.Where("kb_id = ?", kbID).Delete(&domain.DocChunk{}).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", kbID).Delete(&domain.KnowledgeBase{}).Error; err != nil {
			return err
		}
		if err := tx.Where("kb_id = ?", kbID).Delete(&domain.App{}).Error; err != nil {
			return err
		}
		return nil
	})
}
