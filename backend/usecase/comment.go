package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type CommentUsecase struct {
	logger      *log.Logger
	CommentRepo *pg.CommentRepository
	NodeRepo    *pg.NodeRepository
}

func NewCommentUsecase(commentRepo *pg.CommentRepository, logger *log.Logger, nodeRepo *pg.NodeRepository) *CommentUsecase {
	return &CommentUsecase{
		logger:      logger.WithModule("usecase.comment"),
		CommentRepo: commentRepo,
		NodeRepo:    nodeRepo,
	}
}

func (u *CommentUsecase) CreateComment(ctx context.Context, commentReq *domain.CommentReq, KbID string) (string, error) {
	// node
	if _, err := u.NodeRepo.GetNodeByID(ctx, commentReq.NodeID); err != nil {
		return "", err
	}

	// 构造结构体给下方数据库进行插入
	CommentID, err := uuid.NewV7()
	if err != nil {
		return "", err
	}
	CommentStr := CommentID.String()

	err = u.CommentRepo.CreateComment(ctx, &domain.Comment{
		ID:     CommentStr,
		NodeID: commentReq.NodeID,
		Info: domain.CommentInfo{
			UserName: commentReq.UserName,
		},
		ParentID:  commentReq.ParentID,
		RootID:    commentReq.RootID,
		Content:   commentReq.Content,
		CreatedAt: time.Now(),
		KbID:      KbID,
	})
	if err != nil {
		return "", err
	}

	// success
	return CommentStr, nil
}

func (u *CommentUsecase) GetCommentListByNodeID(ctx context.Context, nodeID string) (*domain.PaginatedResult[[]*domain.Comment], error) {
	comments, total, err := u.CommentRepo.GetCommentList(ctx, nodeID)
	if err != nil {
		return nil, err
	}
	// succcess
	return domain.NewPaginatedResult(comments, uint64(total)), nil
}
