package domain

type ShiYuanReq struct {
	KBID string `json:"kb_id" validate:"required"`
}
type ShiYuanResp struct {
	Id      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}
