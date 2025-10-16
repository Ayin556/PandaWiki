package domain

import (
	"bytes"
	"sync"
)

// ConversationState
type ConversationState struct {
	Mutex            sync.Mutex
	Question         string
	Buffer           bytes.Buffer
	IsVisited        bool
	IsDone           bool // 标记 AI 响应是否已完成
	NotificationChan chan string
}

// ConversationManager
var ConversationManager = sync.Map{}

type WechatStatic struct {
	BaseUrl   string `json:"base_url"`
	ImagePath string `json:"image_path"`
}
