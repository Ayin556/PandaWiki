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
	AppTypeDingTalkBot
	AppTypeFeishuBot
)

var AppTypes = []AppType{
	AppTypeWeb,
	AppTypeWidget,
	AppTypeDingTalkBot,
	AppTypeFeishuBot,
}

type App struct {
	ID   string  `json:"id" gorm:"primaryKey"`
	KBID string  `json:"kb_id"`
	Name string  `json:"name"`
	Type AppType `json:"type"`

	Settings AppSettings `json:"settings" gorm:"type:jsonb"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AppSettings struct {
	// nav
	Title string `json:"title,omitempty"`
	Icon  string `json:"icon,omitempty"`
	Btns  []any  `json:"btns,omitempty"`
	// welcome
	WelcomeStr         string   `json:"welcome_str,omitempty"`
	SearchPlaceholder  string   `json:"search_placeholder,omitempty"`
	RecommendQuestions []string `json:"recommend_questions,omitempty"`
	RecommendNodeIDs   []string `json:"recommend_node_ids,omitempty"`
	// seo
	Desc        string `json:"desc,omitempty"`
	Keyword     string `json:"keyword,omitempty"`
	AutoSitemap bool   `json:"auto_sitemap,omitempty"`
	// inject code
	HeadCode string `json:"head_code,omitempty"`
	BodyCode string `json:"body_code,omitempty"`
	// DingTalkBot
	DingTalkBotClientID     string `json:"dingtalk_bot_client_id,omitempty"`
	DingTalkBotClientSecret string `json:"dingtalk_bot_client_secret,omitempty"`
	DingTalkBotTemplateID   string `json:"dingtalk_bot_template_id,omitempty"`
	// FeishuBot
	FeishuBotAppID     string `json:"feishu_bot_app_id,omitempty"`
	FeishuBotAppSecret string `json:"feishu_bot_app_secret,omitempty"`
	// web app nav settings
	CatalogExpanded    int    `json:"catalog_expanded,omitempty"`
	DefaultDisplayMode int    `json:"default_display_mode,omitempty"` // 1: QA mode, 2: doc mode
	ModeSwitchVisible  int    `json:"mode_switch_visible,omitempty"`
	ThemeMode          string `json:"theme_mode,omitempty"`
	// footer settings
	FooterSettings FooterSettings `json:"footer_settings"`
}

type FooterSettings struct {
	FooterStyle string       `json:"footer_style,omitempty"`
	CorpName    string       `json:"corp_name,omitempty"`
	ICP         string       `json:"icp,omitempty"`
	BrandName   string       `json:"brand_name,omitempty"`
	BrandLogo   string       `json:"brand_logo,omitempty"`
	BrandGroups []BrandGroup `json:"brand_groups,omitempty"`
}

type BrandGroup struct {
	Name  string `json:"name,omitempty"`
	Links []Link `json:"links,omitempty"`
}

type Link struct {
	Name string `json:"name,omitempty"`
	URL  string `json:"url,omitempty"`
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

type AppDetailResp struct {
	ID   string `json:"id" gorm:"primaryKey"`
	KBID string `json:"kb_id"`

	Name string  `json:"name"`
	Type AppType `json:"type"`

	Settings AppSettingsResp `json:"settings" gorm:"type:jsonb"`

	RecommendNodes []*RecommendNodeListResp `json:"recommend_nodes,omitempty" gorm:"-"`
}

type AppSettingsResp struct {
	// nav
	Title string `json:"title,omitempty"`
	Icon  string `json:"icon,omitempty"`
	Btns  []any  `json:"btns,omitempty"`
	// welcome
	WelcomeStr         string   `json:"welcome_str,omitempty"`
	SearchPlaceholder  string   `json:"search_placeholder,omitempty"`
	RecommendQuestions []string `json:"recommend_questions,omitempty"`
	RecommendNodeIDs   []string `json:"recommend_node_ids,omitempty"`
	// seo
	Desc        string `json:"desc,omitempty"`
	Keyword     string `json:"keyword,omitempty"`
	AutoSitemap bool   `json:"auto_sitemap,omitempty"`
	// inject code
	HeadCode string `json:"head_code,omitempty"`
	BodyCode string `json:"body_code,omitempty"`
	// DingTalkBot
	DingTalkBotClientID     string `json:"dingtalk_bot_client_id,omitempty"`
	DingTalkBotClientSecret string `json:"dingtalk_bot_client_secret,omitempty"`
	DingTalkBotTemplateID   string `json:"dingtalk_bot_template_id,omitempty"`
	// FeishuBot
	FeishuBotAppID     string `json:"feishu_bot_app_id,omitempty"`
	FeishuBotAppSecret string `json:"feishu_bot_app_secret,omitempty"`
	// web nav settings
	CatalogExpanded    int    `json:"catalog_expanded,omitempty"`
	DefaultDisplayMode int    `json:"default_display_mode,omitempty"` // 1: QA mode, 2: doc mode
	ModeSwitchVisible  int    `json:"mode_switch_visible,omitempty"`
	ThemeMode          string `json:"theme_mode,omitempty"`
	// footer settings
	FooterSettings FooterSettings `json:"footer_settings"`
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

type UpdateAppReq struct {
	Name     *string      `json:"name"`
	Settings *AppSettings `json:"settings" gorm:"type:jsonb"`
}

type CreateAppReq struct {
	Name string  `json:"name"`
	Type AppType `json:"type" validate:"required,oneof=1 2 3 4"`
	Icon string  `json:"icon"`
	KBID string  `json:"kb_id" validate:"required"`
}

type AppInfoResp struct {
	Name string `json:"name"`

	Settings AppSettingsResp `json:"settings" gorm:"type:jsonb"`

	RecommendNodes []*RecommendNodeListResp `json:"recommend_nodes,omitempty" gorm:"-"`
}
