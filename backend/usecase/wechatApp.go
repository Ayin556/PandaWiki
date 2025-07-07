package usecase

import (
	"context"
	"encoding/xml"
	"fmt"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/pkg/bot/wechat"
	"github.com/sbzhu/weworkapi_golang/wxbizmsgcrypt"
)

func (u *AppUsecase) VerifyUrlWechatAPP(ctx context.Context, signature, timestamp, nonce, echostr, KbId string) ([]byte, error) {

	// find wechat-bot
	appres, err := u.GetAppDetailByKBIDAndAppType(ctx, KbId, domain.AppTypeWechatBot)
	if err != nil {
		u.logger.Error("find Appdetail failed")
	}

	u.logger.Debug("wechat app info", log.Any("info", appres))

	wc, err := wechat.NewWechatConfig(
		ctx,
		appres.Settings.WeChatAppCorpID,
		appres.Settings.WeChatAppToken,
		appres.Settings.WeChatAppEncodingAESKey,
		KbId,
		appres.Settings.WeChatAppSecret,
		appres.Settings.WeChatAppAgentID,
		u.logger,
	)

	if err != nil {
		u.logger.Error("failed to create WechatConfig", log.Error(err))
		return nil, err
	}

	body, err := wc.VerifyUrlWechatAPP(signature, timestamp, nonce, echostr)
	if err != nil {
		u.logger.Error("wc verifiyUrl failed", log.Error(err))
		return nil, err
	}
	return body, nil
}

func (u *AppUsecase) Wechat(ctx context.Context, signature, timestamp, nonce string, body []byte, KbId string, remoteip string) error {

	// find wechat-bot
	appres, err := u.GetAppDetailByKBIDAndAppType(ctx, KbId, domain.AppTypeWechatBot)

	if err != nil {
		u.logger.Error("find Appdetail failed")
	}

	wc, err := wechat.NewWechatConfig(
		ctx,
		appres.Settings.WeChatAppCorpID,
		appres.Settings.WeChatAppToken,
		appres.Settings.WeChatAppEncodingAESKey,
		KbId,
		appres.Settings.WeChatAppSecret,
		appres.Settings.WeChatAppAgentID,
		u.logger,
	)

	if err != nil {
		u.logger.Error("failed to create WechatConfig", log.Error(err))
		return err
	}
	u.logger.Info("remote ip", log.String("ip", remoteip))

	// 先解密消息
	wxcpt := wxbizmsgcrypt.NewWXBizMsgCrypt(wc.Token, wc.EncodingAESKey, wc.CorpID, wxbizmsgcrypt.XmlType)
	decryptMsg, errCode := wxcpt.DecryptMsg(signature, timestamp, nonce, body)
	if errCode != nil {
		u.logger.Error("DecryptMsg failed", log.Error(err))
		return fmt.Errorf("DecryptMsg failed: %v", errCode)
	}
	// u.logger.Info("decryptMsg", log.Any("msg:", decryptMsg))

	var msg wechat.ReceivedMessage
	err = xml.Unmarshal([]byte(decryptMsg), &msg)
	if err != nil {
		return err
	}
	u.logger.Debug("received message", log.Any("message", msg)) // debug level

	// 调用接口，获取到用户的详细消息
	userinfo, err := wc.GetUserInfo(msg.FromUserName)
	if err != nil {
		u.logger.Error("GetUserInfo failed", log.Error(err))
		return err
	}
	u.logger.Info("getuserinfo success", log.Any("userinfo", userinfo))

	// use ai--> 并且传递用户消息
	getQA := u.wechatQAFunc(KbId, appres.Type, remoteip, userinfo)

	// 发送消息给用户
	err = wc.Wechat(msg, getQA)

	if err != nil {
		u.logger.Error("wc wechat failed", log.Error(err))
		return err
	}
	return nil
}

func (u *AppUsecase) SendImmediateResponse(ctx context.Context, signature, timestamp, nonce string, body []byte, kbID string) ([]byte, error) {
	appres, err := u.GetAppDetailByKBIDAndAppType(ctx, kbID, domain.AppTypeWechatBot)

	if err != nil {
		return nil, err
	}

	wc, err := wechat.NewWechatConfig(
		ctx,
		appres.Settings.WeChatAppCorpID,
		appres.Settings.WeChatAppToken,
		appres.Settings.WeChatAppEncodingAESKey,
		kbID,
		appres.Settings.WeChatAppSecret,
		appres.Settings.WeChatAppAgentID,
		u.logger,
	)

	u.logger.Debug("wechat app info", log.Any("app", appres))

	if err != nil {
		return nil, err
	}

	wxcpt := wxbizmsgcrypt.NewWXBizMsgCrypt(wc.Token, wc.EncodingAESKey, wc.CorpID, wxbizmsgcrypt.XmlType)
	decryptMsg, errCode := wxcpt.DecryptMsg(signature, timestamp, nonce, body)

	if errCode != nil {
		return nil, fmt.Errorf("DecrypMsg failed: %v", errCode)
	}

	var msg wechat.ReceivedMessage
	if err := xml.Unmarshal(decryptMsg, &msg); err != nil {
		return nil, err
	}

	// send response "正在思考"
	return wc.SendResponse(msg, "正在思考您的问题，请稍候...")
}
