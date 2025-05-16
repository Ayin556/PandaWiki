package v1

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
)

type AppHandler struct {
	*handler.BaseHandler
	logger              *log.Logger
	auth                middleware.AuthMiddleware
	usecase             *usecase.AppUsecase
	modelUsecase        *usecase.ModelUsecase
	conversationUsecase *usecase.ConversationUsecase
	config              *config.Config
}

func NewAppHandler(e *echo.Echo, baseHandler *handler.BaseHandler, logger *log.Logger, auth middleware.AuthMiddleware, usecase *usecase.AppUsecase, modelUsecase *usecase.ModelUsecase, conversationUsecase *usecase.ConversationUsecase, config *config.Config) *AppHandler {
	h := &AppHandler{
		BaseHandler:         baseHandler,
		logger:              logger.WithModule("handler.v1.app"),
		auth:                auth,
		usecase:             usecase,
		modelUsecase:        modelUsecase,
		conversationUsecase: conversationUsecase,
		config:              config,
	}
	group := e.Group("/api/v1/app", h.auth.Authorize)
	group.POST("", h.CreateApp)
	group.GET("/detail", h.GetAppDetail)
	group.GET("/list", h.GetAppList)
	group.PUT("", h.UpdateApp)
	group.DELETE("", h.DeleteApp)

	share := e.Group("share/v1/app", func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Access-Control-Allow-Origin", "*")
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Content-Type, Origin, Accept")
			if c.Request().Method == "OPTIONS" {
				return c.NoContent(http.StatusOK)
			}
			return next(c)
		}
	})
	share.GET("/link", h.GetByLink)
	return h
}

// CreateApp create app
//
//	@Summary		Create app
//	@Description	Create app
//	@Tags			app
//	@Accept			json
//	@Param			create_app_request	body		domain.CreateAppReq	true	"create app request"
//	@Success		200					{object}	domain.Response
//	@Router			/api/v1/app [post]
func (h *AppHandler) CreateApp(c echo.Context) error {
	createAppRequest := domain.CreateAppReq{}
	if err := c.Bind(&createAppRequest); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}
	if err := c.Validate(&createAppRequest); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	id, err := uuid.NewV7()
	if err != nil {
		return h.NewResponseWithError(c, "create app id failed", err)
	}
	app := &domain.App{
		ID:   id.String(),
		KBID: createAppRequest.KBID,
		Name: createAppRequest.Name,
		Type: createAppRequest.Type,
		Link: fmt.Sprintf("%x", md5.Sum([]byte(id.String()))),
		Settings: domain.AppSettings{
			Icon: createAppRequest.Icon,
		},
		CreatedAt: time.Now(),
	}
	if err := h.usecase.CreateApp(c.Request().Context(), app); err != nil {
		return h.NewResponseWithError(c, "create app failed", err)
	}
	return h.NewResponseWithData(c, map[string]string{
		"id": app.ID,
	})
}

// GetAppDetail get app detail
//
//	@Summary		Get app detail
//	@Description	Get app detail
//	@Tags			app
//	@Accept			json
//	@Produce		json
//	@Param			id	query		string	true	"app id"
//	@Success		200	{object}	domain.Response{data=domain.App}
//	@Router			/api/v1/app/detail [get]
func (h *AppHandler) GetAppDetail(c echo.Context) error {
	id := c.QueryParam("id")
	if id == "" {
		return h.NewResponseWithError(c, "id is required", nil)
	}
	ctx := c.Request().Context()

	app, err := h.usecase.GetAppDetail(ctx, id)
	if err != nil {
		return h.NewResponseWithError(c, "get app detail failed", err)
	}
	return h.NewResponseWithData(c, app)
}

// GetAppList get app list
//
//	@Summary		Get app list
//	@Description	Get app list
//	@Tags			app
//	@Accept			json
//	@Produce		json
//	@Param			kb_id	query		string	true	"kb id"
//	@Success		200		{object}	domain.Response{data=[]domain.AppListItem}
//	@Router			/api/v1/app/list [get]
func (h *AppHandler) GetAppList(c echo.Context) error {
	kbID := c.QueryParam("kb_id")
	if kbID == "" {
		return h.NewResponseWithError(c, "kb id is required", nil)
	}
	apps, err := h.usecase.GetAppList(c.Request().Context(), kbID)
	if err != nil {
		return h.NewResponseWithError(c, "get app list failed", err)
	}
	return h.NewResponseWithData(c, apps)
}

// UpdateApp update app
//
//	@Summary		Update app
//	@Description	Update app
//	@Tags			app
//	@Accept			json
//	@Produce		json
//	@Param			app	body		domain.UpdateAppReq	true	"app"
//	@Success		200	{object}	domain.Response
//	@Router			/api/v1/app [put]
func (h *AppHandler) UpdateApp(c echo.Context) error {
	id := c.QueryParam("id")
	if id == "" {
		return h.NewResponseWithError(c, "id is required", nil)
	}

	appRequest := domain.UpdateAppReq{}
	if err := c.Bind(&appRequest); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	ctx := c.Request().Context()
	if err := h.usecase.UpdateApp(ctx, id, &appRequest); err != nil {
		return h.NewResponseWithError(c, "update app failed", err)
	}

	return h.NewResponseWithData(c, nil)
}

// DeleteApp delete app
//
//	@Summary		Delete app
//	@Description	Delete app
//	@Tags			app
//	@Accept			json
//	@Param			id	query		string	true	"app id"
//	@Success		200	{object}	domain.Response
//	@Router			/api/v1/app [delete]
func (h *AppHandler) DeleteApp(c echo.Context) error {
	id := c.QueryParam("id")
	if id == "" {
		return h.NewResponseWithError(c, "id is required", nil)
	}

	if err := h.usecase.DeleteApp(c.Request().Context(), id); err != nil {
		return h.NewResponseWithError(c, "delete app failed", err)
	}

	return h.NewResponseWithData(c, nil)
}

// GetByLink get app by link
//
//	@Summary		Get app by link
//	@Description	Get app by link
//	@Tags			app
//	@Accept			json
//	@Produce		json
//	@Param			link	query		string	true	"link"
//	@Success		200		{object}	domain.Response{data=domain.App}
//	@Router			/share/v1/app/link [get]
func (h *AppHandler) GetByLink(c echo.Context) error {
	link := c.QueryParam("link")
	if link == "" {
		return h.NewResponseWithError(c, "link is required", nil)
	}

	app, err := h.usecase.GetAppByLink(c.Request().Context(), link)
	if err != nil {
		return h.NewResponseWithError(c, "app not found", err)
	}

	return h.NewResponseWithData(c, app)
}
