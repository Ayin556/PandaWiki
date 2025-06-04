package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

// table: knowledge_bases
type KnowledgeBase struct {
	ID   string `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`

	DatasetID string `json:"dataset_id"`

	// public info for public access
	AccessSettings AccessSettings `json:"access_settings" gorm:"type:jsonb"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AccessSettings struct {
	Ports      []int    `json:"ports"`
	SSLPorts   []int    `json:"ssl_ports"`
	PublicKey  string   `json:"public_key"`
	PrivateKey string   `json:"private_key"`
	Hosts      []string `json:"hosts"`
}

func (s *AccessSettings) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("invalid access settings value type:", value))
	}
	return json.Unmarshal(bytes, s)
}

func (s AccessSettings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

type CreateKnowledgeBaseReq struct {
	ID         string   `json:"-"`
	Name       string   `json:"name" validate:"required"`
	Ports      []int    `json:"ports"`
	SSLPorts   []int    `json:"ssl_ports"`
	PublicKey  string   `json:"public_key"`
	PrivateKey string   `json:"private_key"`
	Hosts      []string `json:"hosts"`
}

type UpdateKnowledgeBaseReq struct {
	ID             string          `json:"id" validate:"required"`
	Name           *string         `json:"name"`
	AccessSettings *AccessSettings `json:"access_settings"`
}

type KnowledgeBaseListItem struct {
	ID   string `json:"id"`
	Name string `json:"name"`

	DatasetID string `json:"dataset_id"`

	AccessSettings AccessSettings `json:"access_settings" gorm:"type:jsonb"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type KnowledgeBaseDetail struct {
	ID   string `json:"id"`
	Name string `json:"name"`

	DatasetID string `json:"dataset_id"`

	AccessSettings AccessSettings `json:"access_settings" gorm:"type:jsonb"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
