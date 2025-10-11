package v1

import "github.com/chaitin/panda-wiki/consts"

type ScrapeReq struct {
	URL  string `json:"url" validate:"required"`
	KbID string `json:"kb_id" validate:"required"`
}

type ScrapeResp struct {
	TaskId string `json:"task_id"`
	Title  string `json:"title"`
}

type CrawlerResultReq struct {
	TaskId string `json:"task_id"  query:"task_id" validate:"required"`
}

type CrawlerResultResp struct {
	Status  consts.CrawlerStatus `json:"status" validate:"required"`
	Content string               `json:"content"`
}
type SitemapParseReq struct {
	URL string `json:"url" validate:"required"`
}

type SitemapParseResp struct {
	ID   string             `json:"id"`
	List []SitemapParseItem `json:"list"`
}

type SitemapParseItem struct {
	URL   string `json:"url"`
	Title string `json:"title"`
}

type SitemapScrapeReq struct {
	KbID string `json:"kb_id" validate:"required"`
	ID   string `json:"id" validate:"required"`
	URL  string `json:"url" validate:"required"`
}

type SitemapScrapeResp struct {
	Content string `json:"content"`
}

type RssParseReq struct {
	URL string `json:"url" validate:"required"`
}

type RssParseResp struct {
	ID   string         `json:"id"`
	List []RssParseItem `json:"list"`
}

type RssParseItem struct {
	URL   string `json:"url"`
	Title string `json:"title"`
	Desc  string `json:"desc"`
}

type RssScrapeReq struct {
	KbID string `json:"kb_id" validate:"required"`
	ID   string `json:"id" validate:"required"`
	URL  string `json:"url" validate:"required"`
}

type RssScrapeResp struct {
	Content string `json:"content"`
}
