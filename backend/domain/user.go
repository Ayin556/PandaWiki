package domain

import (
	"time"
)

type User struct {
	ID         string    `json:"id" gorm:"primaryKey"`
	Account    string    `json:"account" gorm:"uniqueIndex"`
	Password   string    `json:"password"`
	CreatedAt  time.Time `json:"created_at"`
	LastAccess time.Time `json:"last_access" gorm:"default:null"`
}

type CreateUserReq struct {
	Account  string `json:"account" validate:"required"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginReq struct {
	Account  string `json:"account" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResp struct {
	Token string `json:"token"`
}

type UserInfoResp struct {
	ID         string     `json:"id"`
	Account    string     `json:"account"`
	LastAccess *time.Time `json:"last_access,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

type UserListItemResp struct {
	ID         string     `json:"id"`
	Account    string     `json:"account"`
	LastAccess *time.Time `json:"last_access,omitempty"`
}

type ResetPasswordReq struct {
	ID          string `json:"id" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

type UserAccessTime struct {
	UserID    string    `json:"user_id"`
	Timestamp time.Time `json:"timestamp"`
}

type DeleteUserReq struct {
	UserID string `json:"user_id" validate:"required"`
}
