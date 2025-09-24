package v1

type NotionParseReq struct {
	Integration string `json:"integration"`
}
type NotionParseResp struct {
	ID   string            `json:"id"`
	Docs []NotionParseItem `json:"docs"`
}

type NotionParseItem struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type NotionScrapeReq struct {
	ID    string `json:"id"`
	DocId string `json:"doc_id"`
}

type NotionScrapeResp struct {
	Content string `json:"content"`
}
