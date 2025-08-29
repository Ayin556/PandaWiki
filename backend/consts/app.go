package consts

type CopySetting string

const (
	CopySettingNone     CopySetting = ""         // 无限制
	CopySettingAppend   CopySetting = "append"   // 增加内容尾巴
	CopySettingDisabled CopySetting = "disabled" // 禁止复制内容
)

type WatermarkSetting string

const (
	WatermarkDisabled WatermarkSetting = ""        // 未开启水印
	WatermarkHidden   WatermarkSetting = "hidden"  // 隐形水印
	WatermarkVisible  WatermarkSetting = "visible" // 显性水印
)

type CaptchaStatus string

const (
	CaptchaStatusEnable  CaptchaStatus = "enable"
	CaptchaStatusDisable CaptchaStatus = "disable"
)

type CaptchaSettings struct {
	ChatStatus    CaptchaStatus `json:"chat_status" validate:"omitempty,oneof='' enable disable"`
	CommentStatus CaptchaStatus `json:"comment_status" validate:"omitempty,oneof='' enable disable"`
}
