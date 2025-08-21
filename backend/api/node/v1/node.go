package v1

import (
	"time"

	"github.com/chaitin/panda-wiki/domain"
)

type GetNodeDetailReq struct {
	KbId string `query:"kb_id" json:"kb_id" validate:"required"`
	ID   string `query:"id" json:"id" validate:"required"`
}

type NodeDetailResp struct {
	ID          string                 `json:"id"`
	KbID        string                 `json:"kb_id"`
	Type        domain.NodeType        `json:"type"`
	Status      domain.NodeStatus      `json:"status"`
	Visibility  domain.NodeVisibility  `json:"visibility"`
	Name        string                 `json:"name"`
	Content     string                 `json:"content"`
	Meta        domain.NodeMeta        `json:"meta"`
	ParentID    string                 `json:"parent_id"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	Permissions domain.NodePermissions `json:"permissions"`
}
