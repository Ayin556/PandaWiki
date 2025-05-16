package usecase

import (
	"context"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type AppUsecase struct {
	repo             *pg.AppRepository
	docRepo          *pg.DocRepository
	conversationRepo *pg.ConversationRepository
	logger           *log.Logger
}

func NewAppUsecase(
	repo *pg.AppRepository,
	docRepo *pg.DocRepository,
	conversationRepo *pg.ConversationRepository,
	logger *log.Logger,
) *AppUsecase {
	return &AppUsecase{
		repo:             repo,
		docRepo:          docRepo,
		conversationRepo: conversationRepo,
		logger:           logger.WithModule("usecase.app"),
	}
}

func (u *AppUsecase) CreateApp(ctx context.Context, app *domain.App) error {
	return u.repo.CreateApp(ctx, app)
}

func (u *AppUsecase) GetAppDetail(ctx context.Context, id string) (*domain.App, error) {
	return u.repo.GetAppDetail(ctx, id)
}

func (u *AppUsecase) GetAppList(ctx context.Context, kbID string) ([]*domain.AppListItem, error) {
	apps, err := u.repo.GetAppList(ctx, kbID)
	if err != nil {
		return nil, err
	}
	conversationStat, err := u.conversationRepo.GetConversationStatForApp(ctx)
	if err != nil {
		return nil, err
	}
	for _, app := range apps {
		if stat, ok := conversationStat[app.ID]; ok {
			app.Stats = stat
		}
	}
	return apps, nil
}

func (u *AppUsecase) UpdateApp(ctx context.Context, id string, appRequest *domain.UpdateAppReq) error {
	if err := u.repo.UpdateApp(ctx, id, appRequest); err != nil {
		return err
	}
	return nil
}

func (u *AppUsecase) GetAppByLink(ctx context.Context, link string) (*domain.AppDetailResp, error) {
	app, err := u.repo.GetAppByLink(ctx, link)
	if err != nil {
		return nil, err
	}
	// get recommend docs
	docs, err := u.docRepo.GetDocListByDocIDs(ctx, app.Settings.RecommendDocIDs)
	if err != nil {
		return nil, err
	}
	app.RecommendDocs = docs

	return app, nil
}

func (u *AppUsecase) DeleteApp(ctx context.Context, id string) error {
	return u.repo.DeleteApp(ctx, id)
}
