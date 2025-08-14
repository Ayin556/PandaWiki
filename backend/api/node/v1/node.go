package v1

type GetNodeDetailReq struct {
	KbId string `query:"kb_id" json:"kb_id" validate:"required"`
	ID   string `query:"id" json:"id" validate:"required"`
}
