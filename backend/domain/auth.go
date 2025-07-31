package domain

type AuthType string

const (
	AuthTypeNull       AuthType = ""           // 无认证
	AuthTypeSimple     AuthType = "simple"     // 简单口令
	AuthTypeEnterprise AuthType = "enterprise" // 企业认证
)

type AuthGetReq struct {
}

type AuthGetResp struct {
	AuthType AuthType `json:"auth_type"`
}

type AuthLoginSimpleReq struct {
	Password string `json:"password" validate:"required"`
}

type AuthLoginSimpleResp struct {
}
