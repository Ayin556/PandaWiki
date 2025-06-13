package usecase

import (
	"context"
	"fmt"

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
	var result []domain.Page
	for _, page := range req.PageIDs {
		c := utils.NewNotionClient(req.Integration, n.logger)
		res, err := c.GetPageContent(ctx, page)
		if err != nil {
			return nil, fmt.Errorf("get Pages %s error: %s", page.Id, err.Error())
		}
		result = append(result, *res)
		n.logger.Debug("Get Doc ", log.String("page_id", page.Id), log.String("content", res.Content))
	}
	return result, nil
}
