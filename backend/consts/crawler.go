package consts

type CrawlerStatus string

const (
	CrawlerStatusPending   CrawlerStatus = "pending"
	CrawlerStatusCompleted CrawlerStatus = "completed"
	CrawlerStatusFailed    CrawlerStatus = "failed"
)
