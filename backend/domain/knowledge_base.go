package domain

import "time"

// table: knowledge_bases
type KnowledgeBase struct {
	ID   string `json:"id" gorm:"primaryKey"`
	Name string `json:"name"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type KBStats struct {
	KBID       string `json:"kb_id"`
	DocCount   int    `json:"doc_count"`
	ChunkCount int    `json:"chunk_count"`
	WordCount  int    `json:"word_count"`
}

type CreateKnowledgeBaseReq struct {
	Name string `json:"name" validate:"required"`
}

type UpdateKnowledgeBaseReq struct {
	ID   string `json:"id" validate:"required"`
	Name string `json:"name" validate:"required"`
}

type KnowledgeBaseListItem struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Stats KBStats `json:"stats" gorm:"-"`
}

type KnowledgeBaseDetail struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type ChatToKBReq struct {
	KBID     string             `json:"kb_id" validate:"required"`
	Messages []*ChatToKBMessage `json:"messages" validate:"required"`
}

type ChatToKBMessage struct {
	Role    string `json:"role" validate:"required, oneof=user assistant"`
	Content string `json:"content" validate:"required"`
}
