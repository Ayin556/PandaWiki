package share

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/usecase"
)

type ShareAppHandler struct {
	*handler.BaseHandler
	logger  *log.Logger
	usecase *usecase.AppUsecase
}

func NewShareAppHandler(
	e *echo.Echo,
	baseHandler *handler.BaseHandler,
	logger *log.Logger,
	usecase *usecase.AppUsecase,
) *ShareAppHandler {
	h := &ShareAppHandler{
		BaseHandler: baseHandler,
		logger:      logger.WithModule("handler.share.app"),
		usecase:     usecase,
	}

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
	share.GET("/web/info", h.GetWebAppInfo)
	return h
}

// GetAppInfo
//
//	@Summary		GetAppInfo
//	@Description	GetAppInfo
//	@Tags			share_app
//	@Accept			json
//	@Produce		json
//	@Param			X-KB-ID	header		string	true	"kb id"
//	@Success		200		{object}	domain.Response
//	@Router			/share/v1/app/web/info [get]
func (h *ShareAppHandler) GetWebAppInfo(c echo.Context) error {
	kbID := c.Request().Header.Get("X-KB-ID")
	if kbID == "" {
		return h.NewResponseWithError(c, "kb_id is required", nil)
	}
	appInfo, err := h.usecase.GetWebAppInfo(c.Request().Context(), kbID)
	if err != nil {
		return h.NewResponseWithError(c, err.Error(), err)
	}
	return h.NewResponseWithData(c, appInfo)
}
