package v1

type WikiJSReq struct {
	KbID string `json:"kb_id" validate:"required"`
}
type WikiJSPage struct {
	Id          string `json:"id"`
	Description string `json:"description"`
	Title       string `json:"title"`
	ContentType string `json:"contentType"`
	Content     string `json:"content"`
	Render      string `json:"render"`
}

type WikiJSResp struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}
