package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type Comment struct {
	ID string `json:"id" gorm:"primaryKey"`

	KbID      string      `json:"kb_id"`
	UserID    string      `json:"user_id"`
	NodeID    string      `json:"node_id" gorm:"index"`
	Info      CommentInfo `json:"info" gorm:"type:jsonb"`
	ParentID  string      `json:"parent_id"`
	RootID    string      `json:"root_id"`
	Content   string      `json:"content"`
	CreatedAt time.Time   `json:"created_at"`
}

type CommentInfo struct {
	UserName string `json:"user_name"`
}

func (d *CommentInfo) Value() (driver.Value, error) {
	return json.Marshal(d)
}

func (d *CommentInfo) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("invalid comment info type:", value))
	}
	return json.Unmarshal(bytes, d)
}

// 前端请求
type CommentReq struct {
	NodeID   string `json:"node_id" validate:"required"`
	Content  string `json:"content" validate:"required"`
	UserName string `json:"user_name"`
	ParentID string `json:"parent_id"`
	RootID   string `json:"root_id"`
}
