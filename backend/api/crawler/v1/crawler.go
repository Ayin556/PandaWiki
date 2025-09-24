package v1

type ScrapeReq struct {
	URL string `json:"url"`
}

type ScrapeResp struct {
	Title   string `json:"title"`
	Content string `json:"content"`
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
	ID  string `json:"id" validate:"required"`
	URL string `json:"url" validate:"required"`
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
	ID  string `json:"id"`
	URL string `json:"url" validate:"required"`
}

type RssScrapeResp struct {
	Content string `json:"content"`
}
