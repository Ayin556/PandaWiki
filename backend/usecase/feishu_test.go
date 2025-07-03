package usecase

import (
	"context"
	"testing"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
)

var (
	c        *FeishuUseCase
	ctx      = context.Background()
	token    = "token"
	appid    = "appid"
	secretId = "secretId"
	baseReq  = &domain.FeishuBaseReq{
		AppID:           appid,
		AppSecret:       secretId,
		UserAccessToken: token,
	}
)

func init() {
	config, _ := config.NewConfig()
	l := log.NewLogger(config)
	c = NewFeishuUseCase(l, nil)
}

func TestListSpace(t *testing.T) {
	res, err := c.GetSpacelist(ctx, &domain.GetSpaceListReq{FeishuBaseReq: *baseReq})
	if err != nil {
		t.Error(err)
	}
	t.Log(res)
}

func TestSearshWiki(t *testing.T) {
	req := &domain.SearchWikiReq{
		FeishuBaseReq: *baseReq,
		Query:         "",
	}
	docxs, err := c.SearchWiki(ctx, req)
	if err != nil {
		t.Error(err)
	}
	t.Log(docxs)
}
