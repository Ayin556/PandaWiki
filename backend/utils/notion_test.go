package utils

import (
	"context"
	"testing"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
)

func TestList(t *testing.T) {
	cfg, _ := config.NewConfig()
	c := NewNotionClient("interation", log.NewLogger(cfg))
	L, err := c.GetList(t.Context(), "")
	if err != nil {
		t.Error(err)
	}
	for _, v := range L {
		t.Log(v.Id, v.Title)
	}
	var req domain.PageInfo
	req.Id = "id"
	res, err := c.GetPageContent(context.Background(), req)
	if err != nil {
		t.Error(err)
	}
	t.Log(res.Content)
}
