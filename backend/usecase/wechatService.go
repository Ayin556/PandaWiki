package usecase

import (
	"context"
	"time"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/pkg/bot/wechatservice"
)

func (u *AppUsecase) VerifyUrlWechatService(ctx context.Context, signature, timestamp, nonce, echostr, kbID string) ([]byte, error) {
	// 只有5秒
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// find wechat-bot
	appres, err := u.GetAppDetailByKBIDAndAppType(ctx, kbID, domain.AppTypeWechatServiceBot)
	if err != nil {
		u.logger.Error("find Appdetail failed", log.Error(err))
		return nil, err
	}

	u.logger.Info("wechat Service info", log.Any("info", appres))

	WechatServiceConf, err := u.NewWechatServiceConfig(ctx, appres, kbID)

	if err != nil {
		u.logger.Error("failed to create WechatServiceConfig", log.Error(err))
		return nil, err
	}

	body, err := WechatServiceConf.VerifyUrlWechatService(signature, timestamp, nonce, echostr)
	if err != nil {
		u.logger.Error("WechatServiceConf verifiyUrl failed", log.Error(err))
		return nil, err
	}
	return body, nil
}

func (u *AppUsecase) Wechat_Service(ctx context.Context, msg *wechatservice.WeixinUserAskMsg, kbID string, WechatServiceConfig *wechatservice.WechatServiceConfig) error {

	// use ai
	getQA := u.getQAFunc(kbID, domain.AppTypeWechatServiceBot)

	err := WechatServiceConfig.Wechat(msg, getQA)

	if err != nil {
		u.logger.Error("WechatServiceConf wechat failed", log.Error(err))
		return err
	}
	return nil
}

func (u *AppUsecase) NewWechatServiceConfig(ctx context.Context, appres *domain.AppDetailResp, kbID string) (*wechatservice.WechatServiceConfig, error) {
	return wechatservice.NewWechatServiceConfig(
		ctx,
		appres.Settings.WeChatServiceCorpID,
		appres.Settings.WeChatServiceToken,
		appres.Settings.WeChatServiceEncodingAESKey,
		kbID,
		appres.Settings.WeChatServiceSecret,
		u.logger,
	)
}
