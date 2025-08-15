package consts

type SourceType string

const (
	SourceTypeDingTalk SourceType = "dingtalk"
	SourceTypeFeishu   SourceType = "feishu"
	SourceTypeWeCom    SourceType = "wecom"
	SourceTypeOAuth    SourceType = "oauth"
	SourceTypeGitHub   SourceType = "github"
	SourceTypeCAS      SourceType = "cas"
	SourceTypeLDAP     SourceType = "ldap"
)
