package utils

import (
	"context"
	"fmt"
	"testing"

	"github.com/chaitin/panda-wiki/domain"
)

var (
	ctx      = context.Background()
	token    = "u-clLbYTUMB3ipbufgwPMus60hnSu10kaPPa20g4i20CNh"
	appid    = "cli_a8de697c18f7d00c"
	secretId = "TKpDKpaTBpqYVDzcLtkVef4n4zMhC4bv"
	baseReq  = &domain.FeishuBaseReq{
		UserAccessToken: token,
		AppID:           appid,
		AppSecret:       secretId,
	}
)

func TestDownlaod(t *testing.T) {
	title, content, err := DownloadDocument(ctx, appid, secretId,
		"https://bcngbc8pjbbi.feishu.cn/wiki/Rp8Kw0O5EihdlNkYgFScSFienTc", nil, "aaa")
	if err != nil {
		t.Error(err)
		return
	}
	fmt.Println(title, content)
}
