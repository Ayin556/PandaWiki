package domain

type ParseURLReq struct {
	URL string `json:"url" validate:"required"`
}

type ParseURLResp struct {
	Items []ParseURLItem `json:"items"`
}

type ParseURLItem struct {
	URL       string `json:"url"`
	Title     string `json:"title"`
	Desc      string `json:"desc"`
	Published string `json:"published"`
}

type ScrapeReq struct {
	URL string `json:"url"`
}

type ScrapeResp struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type ScrapeResponse struct {
	Err  int    `json:"err"`
	Msg  string `json:"msg"`
	Data struct {
		Title    string `json:"title"`
		Markdown string `json:"markdown"`
	} `json:"data"`
}

type ScrapeRequest struct {
	URL string `json:"url"`
}
