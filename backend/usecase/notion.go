package usecase

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/utils"
)

type NotionUseCase struct {
	logger *log.Logger
}

func NewNotionUsecase(logger *log.Logger) *NotionUseCase {
	return &NotionUseCase{
		logger: logger.WithModule("usecase.NotionUseCase"),
	}
}
func (n *NotionUseCase) GetList(ctx context.Context, token, titleContain string) ([]domain.PageInfo, error) {
	return utils.NewNotionClient(token, n.logger).GetList(ctx, titleContain)
}
func (n *NotionUseCase) GetDocs(ctx context.Context, req domain.GetDocsReq) ([]domain.Page, error) {
	return utils.NewNotionClient(req.Integration, n.logger).GetPagesContent(req.PageIDs)
}
