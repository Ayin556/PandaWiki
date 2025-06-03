package rag

import (
	"context"
	"fmt"
)

// GetModelConfig 获取模型配置
func (c *Client) AddModelConfig(ctx context.Context, req AddModelConfigRequest) (*ModelConfig, error) {
	httpReq, err := c.newRequest(ctx, "POST", "models", req)
	if err != nil {
		return nil, err
	}
	var resp AddModelConfigResponse
	if err := c.do(httpReq, &resp); err != nil {
		return nil, err
	}
	return &resp.Data, nil
}

func (c *Client) GetModelConfigList(ctx context.Context, modelID string) ([]ModelConfig, error) {
	httpReq, err := c.newRequest(ctx, "GET", "models", nil)
	if err != nil {
		return nil, err
	}
	var resp ListModelConfigsResponse
	if err := c.do(httpReq, &resp); err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (c *Client) UpdateModelConfig(ctx context.Context, modelID string, req AddModelConfigRequest) error {
	path := fmt.Sprintf("models/%s", modelID)
	httpReq, err := c.newRequest(ctx, "PUT", path, req)
	if err != nil {
		return err
	}
	var resp AddModelConfigResponse
	if err := c.do(httpReq, &resp); err != nil {
		return err
	}
	return nil
}

func (c *Client) DeleteModelConfig(ctx context.Context, modelIDs ...string) error {
	httpReq, err := c.newRequest(ctx, "DELETE", "models", DeleteModelConfigsRequest{ModelIDs: modelIDs})
	if err != nil {
		return err
	}
	var resp CommonResponse
	if err := c.do(httpReq, &resp); err != nil {
		return err
	}
	return nil
}
