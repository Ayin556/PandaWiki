package middleware

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	echoMiddleware "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type JWTMiddleware struct {
	config         *config.Config
	jwtMiddleware  echo.MiddlewareFunc
	logger         *log.Logger
	userAccessRepo *pg.UserAccessRepository
}

func NewJWTMiddleware(config *config.Config, logger *log.Logger, userAccessRepo *pg.UserAccessRepository) *JWTMiddleware {
	jwtMiddleware := echoMiddleware.WithConfig(echoMiddleware.Config{
		SigningKey: []byte(config.Auth.JWT.Secret),
		ErrorHandler: func(c echo.Context, err error) error {
			logger.Error("jwt auth failed", log.Error(err))
			return c.JSON(http.StatusUnauthorized, domain.Response{
				Success: false,
				Message: "Unauthorized",
			})
		},
	})
	return &JWTMiddleware{
		config:         config,
		jwtMiddleware:  jwtMiddleware,
		logger:         logger.WithModule("middleware.jwt"),
		userAccessRepo: userAccessRepo,
	}
}

func (m *JWTMiddleware) Authorize(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// First apply JWT middleware
		if err := m.jwtMiddleware(next)(c); err != nil {
			return err
		}

		// If we get here, JWT authentication was successful
		// Get user ID and update access time
		if userID, ok := m.MustGetUserID(c); ok {
			m.userAccessRepo.UpdateAccessTime(userID)
		}

		return nil
	}
}

func (m *JWTMiddleware) MustGetUserID(c echo.Context) (string, bool) {
	user, ok := c.Get("user").(*jwt.Token)
	if !ok || user == nil {
		return "", false
	}
	claims, ok := user.Claims.(jwt.MapClaims)
	if !ok {
		return "", false
	}
	id, ok := claims["id"].(string)
	return id, ok
}
