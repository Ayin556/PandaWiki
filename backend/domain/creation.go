package domain

type TextReq struct {
	Text        string `json:"text" validate:"required"`
	Stream      bool   `json:"stream"`
	Instruction string `json:"instruction"` // instruction: improve, summary, extend, shorten, etc.
}
