package v1

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
)

type UserHandler struct {
	*handler.BaseHandler
	usecase *usecase.UserUsecase
	logger  *log.Logger
	config  *config.Config
	auth    middleware.AuthMiddleware
}

func NewUserHandler(e *echo.Echo, baseHandler *handler.BaseHandler, logger *log.Logger, usecase *usecase.UserUsecase, auth middleware.AuthMiddleware, config *config.Config) *UserHandler {
	h := &UserHandler{
		BaseHandler: baseHandler,
		logger:      logger.WithModule("handler.v1.user"),
		usecase:     usecase,
		auth:        auth,
		config:      config,
	}
	group := e.Group("/api/v1/user")
	group.POST("/login", h.Login)

	group.POST("/create", h.CreateUser, h.auth.Authorize)
	group.GET("", h.GetUserInfo, h.auth.Authorize)
	group.GET("/list", h.ListUsers, h.auth.Authorize)
	group.PUT("/reset_password", h.ResetPassword, h.auth.Authorize)
	group.DELETE("/delete", h.DeleteUser, h.auth.Authorize)

	return h
}

// CreateUser
//
//	@Summary		CreateUser
//	@Description	CreateUser
//	@Tags			user
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.CreateUserReq true	"CreateUser Request"
//	@Success		200		{object}	domain.Response
//	@Router			/api/v1/user/create [post]
func (h *UserHandler) CreateUser(c echo.Context) error {
	var req domain.CreateUserReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	err := h.usecase.CreateUser(c.Request().Context(), &domain.User{
		ID:       uuid.New().String(),
		Account:  req.Account,
		Password: req.Password,
	})
	if err != nil {
		return h.NewResponseWithError(c, "failed to create user", err)
	}

	return h.NewResponseWithData(c, nil)
}

// Login
//
//	@Summary		Login
//	@Description	Login
//	@Tags			user
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.LoginReq	true	"Login Request"
//	@Success		200		{object}	domain.LoginResp
//	@Router			/api/v1/user/login [post]
func (h *UserHandler) Login(c echo.Context) error {
	var req domain.LoginReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	token, err := h.usecase.VerifyUserAndGenerateToken(c.Request().Context(), req)
	if err != nil {
		return h.NewResponseWithError(c, "failed to login", err)
	}

	return h.NewResponseWithData(c, domain.LoginResp{Token: token})
}

// GetUser
//
//	@Summary		GetUser
//	@Description	GetUser
//	@Tags			user
//	@Accept			json
//	@Success		200	{object}	domain.UserInfoResp
//	@Router			/api/v1/user [get]
func (h *UserHandler) GetUserInfo(c echo.Context) error {
	userID, ok := h.auth.MustGetUserID(c)
	if !ok {
		return h.NewResponseWithError(c, "failed to get user", nil)
	}

	user, err := h.usecase.GetUser(c.Request().Context(), userID)
	if err != nil {
		return h.NewResponseWithError(c, "failed to get user", err)
	}

	return h.NewResponseWithData(c, user)
}

// ListUsers
//
//	@Summary		ListUsers
//	@Description	ListUsers
//	@Tags			user
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	domain.Response{data=[]domain.UserListItemResp}
//	@Router			/api/v1/user/list [get]
func (h *UserHandler) ListUsers(c echo.Context) error {
	users, err := h.usecase.ListUsers(c.Request().Context())
	if err != nil {
		return h.NewResponseWithError(c, "failed to list users", err)
	}
	return h.NewResponseWithData(c, users)
}

// ResetPassword
//
//	@Summary		ResetPassword
//	@Description	ResetPassword
//	@Tags			user
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.ResetPasswordReq	true	"ResetPassword Request"
//	@Success		200		{object}	domain.Response
//	@Router			/api/v1/user/reset_password [put]
func (h *UserHandler) ResetPassword(c echo.Context) error {
	var req domain.ResetPasswordReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	if err := c.Validate(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	userID, ok := h.auth.MustGetUserID(c)
	if !ok {
		return h.NewResponseWithError(c, "failed to get user", nil)
	}

	user, err := h.usecase.GetUser(c.Request().Context(), userID)
	if err != nil {
		return h.NewResponseWithError(c, "failed to get user", err)
	}
	if user.Account == "admin" && userID == req.ID {
		return h.NewResponseWithError(c, "请修改安装目录下 .env 文件中的 ADMIN_PASSWORD，并重启 panda-wiki-api 容器使更改生效。", nil)
	}
	if user.Account != "admin" && userID != req.ID {
		return h.NewResponseWithError(c, "只有管理员可以重置其他用户密码", nil)
	}
	err = h.usecase.ResetPassword(c.Request().Context(), &req)
	if err != nil {
		return h.NewResponseWithError(c, "failed to reset password", err)
	}

	return h.NewResponseWithData(c, nil)
}

// DeleteUser
//
//	@Summary		DeleteUser
//	@Description	DeleteUser
//	@Tags			user
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.DeleteUserReq	true	"DeleteUser Request"
//	@Success		200		{object}	domain.Response
//	@Router			/api/v1/user/delete [delete]
func (h *UserHandler) DeleteUser(c echo.Context) error {
	var req domain.DeleteUserReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}

	userID, ok := h.auth.MustGetUserID(c)
	if !ok {
		return h.NewResponseWithError(c, "failed to get user", nil)
	}
	if userID == req.UserID {
		return h.NewResponseWithError(c, "cannot delete yourself", nil)
	}

	user, err := h.usecase.GetUser(c.Request().Context(), userID)
	if err != nil {
		return h.NewResponseWithError(c, "failed to get user", err)
	}
	if user.Account != "admin" {
		return h.NewResponseWithError(c, "只有管理员可以删除用户", nil)
	}

	err = h.usecase.DeleteUser(c.Request().Context(), req.UserID)
	if err != nil {
		return h.NewResponseWithError(c, "failed to delete user", err)
	}

	return h.NewResponseWithData(c, nil)
}
