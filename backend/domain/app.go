package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type AppType uint8

const (
	AppTypeWeb AppType = iota + 1
	AppTypeWidget
	AppTypeDingbot
	AppTypeFeishu
	AppTypeWecom
)

var AppTypes = []AppType{
	AppTypeWeb,
	AppTypeWidget,
	AppTypeDingbot,
	AppTypeFeishu,
	AppTypeWecom,
}

type App struct {
	ID   string  `json:"id" gorm:"primaryKey"`
	KBID string  `json:"kb_id"`
	Name string  `json:"name"`
	Type AppType `json:"type"`
	Link string  `json:"link"`

	Settings AppSettings `json:"settings" gorm:"type:jsonb"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AppSettings struct {
	Icon       string `json:"icon,omitempty"`
	Desc       string `json:"desc,omitempty"`
	WelcomeStr string `json:"welcome_str,omitempty"`

	RecommendQuestions []string `json:"recommend_questions,omitempty"`
	RecommendDocIDs    []string `json:"recommend_doc_ids,omitempty"`
	SearchPlaceholder  string   `json:"search_placeholder,omitempty"`

	// dingbot
	DingbotClientID   string `json:"dingbot_client_id,omitempty"`
	DingbotAesKey     string `json:"dingbot_aes_key,omitempty"`
	DingbotToken      string `json:"dingbot_token,omitempty"`
	DingbotWelcomeStr string `json:"dingbot_welcome_str,omitempty"`
	// feishu
	FeishubotAppID             string `json:"feishubot_app_id,omitempty"`
	FeishubotAppSecret         string `json:"feishubot_app_secret,omitempty"`
	FeishubotEncryptKey        string `json:"feishubot_encrypt_key,omitempty"`
	FeishubotVerificationToken string `json:"feishubot_verification_token,omitempty"`
	FeishubotWelcomeStr        string `json:"feishubot_welcome_str,omitempty"`
	// Wecom
	WecombotAgentID             int    `json:"wecombot_agent_id,omitempty"`
	WecombotCorpID              string `json:"wecombot_corp_id,omitempty"`
	WecombotCorpSecret          string `json:"wecombot_corp_secret,omitempty"`
	WecombotSuiteID             string `json:"wecombot_suite_id,omitempty"`
	WecombotSuiteToken          string `json:"wecombot_suite_token,omitempty"`
	WecombotSuiteEncodingAesKey string `json:"wecombot_suite_encoding_aes_key,omitempty"`
	WecombotWelcomeStr          string `json:"wecombot_welcome_str,omitempty"`
}

func (s *AppSettings) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("invalid app settings value type:", value))
	}
	return json.Unmarshal(bytes, s)
}

func (s AppSettings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

type AppListItem struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Type AppType `json:"type"`
	Link string  `json:"link"`

	Settings AppSettings `json:"settings" gorm:"type:jsonb"`

	Stats *ConversationStatForApp `json:"stats" gorm:"-"`
}

type AppDetailResp struct {
	ID   string  `json:"id" gorm:"primaryKey"`
	Name string  `json:"name"`
	Type AppType `json:"type"`
	Link string  `json:"link"`

	Settings AppSettingsResp `json:"settings" gorm:"type:jsonb"`

	RecommendDocs []*RecommandDocListResp `json:"recommend_docs,omitempty" gorm:"-"`
}

type AppSettingsResp struct {
	Icon       string `json:"icon,omitempty"`
	Desc       string `json:"desc,omitempty"`
	WelcomeStr string `json:"welcome_str,omitempty"`

	RecommendQuestions []string `json:"recommend_questions,omitempty"`
	RecommendDocIDs    []string `json:"recommend_doc_ids,omitempty"`
	SearchPlaceholder  string   `json:"search_placeholder,omitempty"`
}

func (s *AppSettingsResp) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("invalid app settings value type:", value))
	}
	return json.Unmarshal(bytes, s)
}

func (s AppSettingsResp) Value() (driver.Value, error) {
	return json.Marshal(s)
}

type ConversationCount struct {
	AppID string `json:"app_id"`
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type ConversationStatForApp struct {
	AppID          string               `json:"app_id"`
	Last24HCount   int                  `json:"last_24h_count" gorm:"column:last_24h_count"`
	Last24HIPCount int                  `json:"last_24h_ip_count" gorm:"column:last_24h_ip_count"`
	DayCounts      []*ConversationCount `json:"day_counts" gorm:"-"`
}

type UpdateAppReq struct {
	Name     *string      `json:"name"`
	Settings *AppSettings `json:"settings" gorm:"type:jsonb"`
}

type CreateAppReq struct {
	Name string  `json:"name"`
	Type AppType `json:"type" validate:"required,oneof=1 2 3 4 5"`
	Icon string  `json:"icon"`
	KBID string  `json:"kb_id" validate:"required"`
}
