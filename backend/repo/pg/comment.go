package pg

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
)

type CommentRepository struct {
	db     *pg.DB
	logger *log.Logger
}

func NewCommentRepository(db *pg.DB, logger *log.Logger) *CommentRepository {
	return &CommentRepository{db: db, logger: logger.WithModule("repo.pg.comment")}
}

func (r *CommentRepository) CreateComment(ctx context.Context, comment *domain.Comment) error {
	// 插入到数据库中
	if err := r.db.WithContext(ctx).Create(comment).Error; err != nil {
		return err
	}
	return nil
}

func (r *CommentRepository) GetCommentList(ctx context.Context, nodeID string) ([]*domain.Comment, int64, error) {
	// 按照时间排序来查询node_id的comments
	comments := []*domain.Comment{}
	query := r.db.Model(&domain.Comment{}).Where("node_id = ?", nodeID)

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Find(&comments).Error; err != nil {
		return nil, 0, err
	}

	return comments, count, nil

}
