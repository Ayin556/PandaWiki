package domain

type FeishuBaseReq struct {
	UserAccessToken string `json:"user_access_token"`
	AppID           string `json:"app_id"`
	AppSecret       string `json:"app_secret"`
}
type GetSpaceListReq struct {
	FeishuBaseReq
}
type GetSpaceListResp struct {
	Name    string `json:"name"`
	SpaceId string `json:"space_id"`
}

type SearchWikiReq struct {
	FeishuBaseReq
	SpaceId string `json:"space_id"`
	Query   string `json:"query"`
}

type SearchWikiResp struct {
	Title   string `json:"title"`
	Url     string `json:"url"`
	SpaceId string `json:"space_id"`
}

type GetDocxReq struct {
	FeishuBaseReq
	KBID string   `json:"kb_id" validate:"required"`
	Urls []string `json:"urls"`
}
type GetDocxResp struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type SearchDocxReq struct {
	FeishuBaseReq
}

type SearchDocxResp struct {
	Name string `json:"name"`
	Url  string `json:"url"`
}
