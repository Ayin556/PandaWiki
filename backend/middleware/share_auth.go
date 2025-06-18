package middleware

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/usecase"
)

type ShareAuthMiddleware struct {
	logger    *log.Logger
	kbUsecase *usecase.KnowledgeBaseUsecase
}

func NewShareAuthMiddleware(logger *log.Logger, kbUsecase *usecase.KnowledgeBaseUsecase) *ShareAuthMiddleware {
	return &ShareAuthMiddleware{
		logger:    logger.WithModule("middleware.share_auth"),
		kbUsecase: kbUsecase,
	}
}

func (h *ShareAuthMiddleware) Authorize(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		kbID := c.Request().Header.Get("X-KB-ID")
		if kbID == "" {
			h.logger.Error("kb_id is empty")
			return c.JSON(http.StatusUnauthorized, domain.Response{
				Success: false,
				Message: "Unauthorized",
			})
		}
		kb, err := h.kbUsecase.GetKnowledgeBase(c.Request().Context(), kbID)
		if err != nil {
			h.logger.Error("get knowledge base failed", log.String("kb_id", kbID), log.Error(err))
			return c.JSON(http.StatusUnauthorized, domain.Response{
				Success: false,
				Message: "Unauthorized",
			})
		}
		if kb.AccessSettings.SimpleAuth.Enabled && kb.AccessSettings.SimpleAuth.Password != "" {
			password := c.Request().Header.Get("X-Simple-Auth-Password")
			if password != kb.AccessSettings.SimpleAuth.Password {
				h.logger.Error("simple auth failed", log.String("kb_id", kbID), log.String("password", password))
				return c.JSON(http.StatusUnauthorized, domain.Response{
					Success: false,
					Message: "Unauthorized",
				})
			}
		}
		return next(c)
	}
}
