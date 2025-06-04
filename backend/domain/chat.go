package domain

type ChatRequest struct {
	ConversationID string  `json:"conversation_id"`
	Message        string  `json:"message" validate:"required"`
	Nonce          string  `json:"nonce"`
	AppType        AppType `json:"app_type" validate:"required,oneof=1 2"`

	KBID  string `json:"-" validate:"required"`
	AppID string `json:"-"`

	ModelInfo *Model `json:"-"`

	RemoteIP string `json:"-"`
}
