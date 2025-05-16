package domain

import (
	"fmt"
	"time"
)

const (
	// Scraper topics (bidirectional)
	ScraperRequestTopic  = "apps.panda-wiki.scraper.request"
	ScraperResponseTopic = "apps.panda-wiki.scraper.response"

	// Summary topic (unidirectional)
	SummaryTaskTopic = "apps.panda-wiki.summary.task"

	// Vector topic (unidirectional)
	VectorTaskTopic = "apps.panda-wiki.vector.task"
)

var TopicConsumerName = map[string]string{
	ScraperResponseTopic: "panda-wiki-scraper-consumer",
	SummaryTaskTopic:     "panda-wiki-summary-consumer",
	VectorTaskTopic:      "panda-wiki-vector-consumer",
}

const (
	ScraperResultExpireKeyFmt = "scrape_result:doc_id:%s"
	AllScraperResultExpireKey = "scrape_result:all"
	ScraperResultExpireTime   = 1 * time.Hour
)

func DocScrapeRequestExpireKey(docID string) string {
	return fmt.Sprintf(ScraperResultExpireKeyFmt, docID)
}

type Meta struct {
	KBID            string `json:"kb_id"`
	PageID          string `json:"page_id"`
	CreateTimestamp int64  `json:"create_timestamp"`
}

type DocScrapeRequest struct {
	Meta Meta `json:"meta"`
	Body struct {
		URL string `json:"url"`
	} `json:"body"`
}

type DocScrapeResult struct {
	Meta Meta   `json:"meta"`
	Err  int    `json:"err"`
	MSG  string `json:"msg"`
	Data struct {
		EntryURL     string       `json:"entry_url"`
		Title        string       `json:"title"`
		Description  string       `json:"description"`
		Keywords     []string     `json:"keywords"`
		Favicon      string       `json:"favicon"`
		Charset      string       `json:"charset"`
		Markdown     string       `json:"markdown"`
		Screenshot   string       `json:"screenshot"`
		ResourceType ResourceType `json:"resource_type"`
	} `json:"data"`
}

type PageSummaryRequest struct {
	PageID string `json:"page_id"`
}

type DocVectorContentRequest struct {
	DocIDs []string `json:"doc_ids"`
	Action string   `json:"action"` // upsert, delete
}

// UserAccessMessage 用户访问消息
type UserAccessMessage struct {
	UserID    string    `json:"user_id"`
	Timestamp time.Time `json:"timestamp"`
}
