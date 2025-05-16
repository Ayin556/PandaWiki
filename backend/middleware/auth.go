package middleware

import (
	"fmt"

	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type AuthMiddleware interface {
	Authorize(next echo.HandlerFunc) echo.HandlerFunc
	MustGetUserID(c echo.Context) (string, bool)
}

func NewAuthMiddleware(config *config.Config, logger *log.Logger, userAccessRepo *pg.UserAccessRepository) (AuthMiddleware, error) {
	switch config.Auth.Type {
	case "jwt":
		return NewJWTMiddleware(config, logger, userAccessRepo), nil
	default:
		return nil, fmt.Errorf("invalid auth type: %s", config.Auth.Type)
	}
}
