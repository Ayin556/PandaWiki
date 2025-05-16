package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type DocStatus uint8

const (
	DocStatusPending DocStatus = iota + 1
	DocStatusPublished
	DocStatusFailed
)

type DocSource uint8

const (
	DocSourceURL DocSource = iota + 1
	DocSourceFile
	DocSourceManual
)

type ResourceType string

const (
	// WebPage | PlainText | Excel | Word | PDF | Unknown
	ResourceTypeWebPage   ResourceType = "WebPage"
	ResourceTypePlainText ResourceType = "PlainText"
	ResourceTypeExcel     ResourceType = "Excel"
	ResourceTypeWord      ResourceType = "Word"
	ResourceTypePDF       ResourceType = "PDF"
	ResourceTypeUnknown   ResourceType = "Unknown"
)

// table: documents
type Document struct {
	ID string `json:"id" gorm:"primaryKey"`

	KBID   string    `json:"kb_id" gorm:"uniqueIndex:idx_documents_kb_id_url,priority:1"`
	URL    string    `json:"url" gorm:"uniqueIndex:idx_documents_kb_id_url,priority:2"`
	Source DocSource `json:"source"`
	Status DocStatus `json:"status"`
	Error  string    `json:"error"`

	ResourceType ResourceType `json:"resource_type" gorm:"type:text;default:'Unknown'"`
	Meta         DocMeta      `json:"meta" gorm:"type:jsonb"` // tilte, description, keywords, favicon, etc.
	Content      string       `json:"content"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DocMeta struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Screenshot  string       `json:"screenshot"`
	Keywords    string       `json:"keywords"`
	Favicon     string       `json:"favicon"`
	Charset     string       `json:"charset"`
	DocType     ResourceType `json:"doc_type"`
}

func (d *DocMeta) Value() (driver.Value, error) {
	return json.Marshal(d)
}

func (d *DocMeta) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("invalid doc meta type:", value))
	}
	return json.Unmarshal(bytes, d)
}

// table: doc_chunks
type DocChunk struct {
	ID      string `json:"id" gorm:"primaryKey"`
	KBID    string `json:"kb_id" gorm:"index"`
	DocID   string `json:"doc_id" gorm:"index"`
	Seq     uint   `json:"seq"`
	URL     string `json:"url"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type GetDocListReq struct {
	KBID   string `json:"kb_id" query:"kb_id" validate:"required"`
	Search string `json:"search" query:"search"`
}

type DocListItemResp struct {
	ID           string       `json:"id"`
	URL          string       `json:"url"`
	Source       DocSource    `json:"source"`
	Status       DocStatus    `json:"status"`
	ResourceType ResourceType `json:"resource_type"`
	Error        string       `json:"error"`
	Title        string       `json:"title"`
	Favicon      string       `json:"favicon"`
	WordCount    uint         `json:"word_count"`
	ChunkCount   uint         `json:"chunk_count" gorm:"-"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type RecommandDocListResp struct {
	ID      string `json:"id"`
	URL     string `json:"url"`
	Title   string `json:"title"`
	Summary string `json:"summary"`
}

type DocDetailResp struct {
	ID           string       `json:"id"`
	URL          string       `json:"url"`
	Source       DocSource    `json:"source"`
	Status       DocStatus    `json:"status"`
	ResourceType ResourceType `json:"resource_type"`
	Error        string       `json:"error"`
	Content      string       `json:"content"`
	Meta         DocMeta      `json:"meta"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type DocContent struct {
	ID      string    `json:"id"`
	KBID    string    `json:"kb_id"`
	Content string    `json:"content"`
	Source  DocSource `json:"source"`
	URL     string    `json:"url"`
	Title   string    `json:"title"`
}

func (p DocContent) Value() (driver.Value, error) {
	return json.Marshal(p)
}

func (p *DocContent) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("invalid value type:", value))
	}
	return json.Unmarshal(bytes, p)
}

type CreateDocReq struct {
	KBID    string    `json:"kb_id" validate:"required"`
	Source  DocSource `json:"source" validate:"required,oneof=1 2 3"`
	URL     []string  `json:"url"`
	Title   string    `json:"title"`
	Content string    `json:"content"`
	FileKey []string  `json:"file_key"`
}

type DocActionReq struct {
	DocIDs []string `json:"doc_ids" validate:"required"`
	Action string   `json:"action" validate:"required,oneof=delete"`
}

type UpdateDocReq struct {
	DocID   string  `json:"doc_id" validate:"required"`
	Title   *string `json:"title"`
	Content *string `json:"content"`
}

type ParseURLReq struct {
	URL  string `json:"url" validate:"required"`
	Type string `json:"type" validate:"required,oneof=RSS Sitemap"`
}

type ParseURLResp struct {
	Items []ParseURLItem `json:"items"`
}

type ChunkListItemResp struct {
	ID      string `json:"id"`
	Seq     uint   `json:"seq"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type ParseURLItem struct {
	URL       string `json:"url"`
	Title     string `json:"title"`
	Desc      string `json:"desc"`
	Published string `json:"published"`
}
