package dingtalk

import (
	"context"
	"fmt"
	"sync"
	"time"

	openapi "github.com/alibabacloud-go/darabonba-openapi/v2/client"
	dingtalkcard_1_0 "github.com/alibabacloud-go/dingtalk/card_1_0"
	dingtalkoauth2_1_0 "github.com/alibabacloud-go/dingtalk/oauth2_1_0"
	util "github.com/alibabacloud-go/tea-utils/v2/service"
	"github.com/alibabacloud-go/tea/tea"
	"github.com/google/uuid"
	"github.com/open-dingtalk/dingtalk-stream-sdk-go/chatbot"
	"github.com/open-dingtalk/dingtalk-stream-sdk-go/client"

	"github.com/chaitin/panda-wiki/log"
)

type DingTalkClient struct {
	ctx          context.Context
	cancel       context.CancelFunc
	ClientID     string
	ClientSecret string
	TemplateID   string // 4d18414c-aabc-4ec8-9e67-4ceefeada72a.schema
	oauthClient  *dingtalkoauth2_1_0.Client
	cardClient   *dingtalkcard_1_0.Client
	getQA        func(ctx context.Context, msg string, dataCh chan string) error
	logger       *log.Logger
	tokenCache   struct {
		accessToken string
		expireAt    time.Time
	}
	tokenMutex sync.RWMutex
}

func NewDingTalkClient(ctx context.Context, cancel context.CancelFunc, clientId, clientSecret, templateID string, logger *log.Logger, getQA func(ctx context.Context, msg string, dataCh chan string) error) (*DingTalkClient, error) {
	config := &openapi.Config{}
	config.Protocol = tea.String("https")
	config.RegionId = tea.String("central")
	oauthClient, err := dingtalkoauth2_1_0.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create oauth client: %w", err)
	}
	cardClient, err := dingtalkcard_1_0.NewClient(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create card client: %w", err)
	}
	return &DingTalkClient{
		ctx:          ctx,
		cancel:       cancel,
		ClientID:     clientId,
		ClientSecret: clientSecret,
		TemplateID:   templateID,
		oauthClient:  oauthClient,
		cardClient:   cardClient,
		getQA:        getQA,
		logger:       logger,
	}, nil
}

func (c *DingTalkClient) GetAccessToken() (string, error) {
	c.tokenMutex.RLock()
	// TODO: use redis cache
	if c.tokenCache.accessToken != "" && time.Now().Before(c.tokenCache.expireAt) {
		token := c.tokenCache.accessToken
		c.tokenMutex.RUnlock()
		return token, nil
	}
	c.tokenMutex.RUnlock()

	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()

	if c.tokenCache.accessToken != "" && time.Now().Before(c.tokenCache.expireAt) {
		return c.tokenCache.accessToken, nil
	}

	request := &dingtalkoauth2_1_0.GetAccessTokenRequest{
		AppKey:    tea.String(c.ClientID),
		AppSecret: tea.String(c.ClientSecret),
	}
	response, tryErr := func() (_resp *dingtalkoauth2_1_0.GetAccessTokenResponse, _e error) {
		defer func() {
			if r := tea.Recover(recover()); r != nil {
				_e = r
			}
		}()
		_resp, _err := c.oauthClient.GetAccessToken(request)
		if _err != nil {
			return nil, _err
		}

		return _resp, nil
	}()
	if tryErr != nil {
		return "", tryErr
	}
	accessToken := *response.Body.AccessToken
	c.logger.Info("get access token", log.String("access_token", accessToken), log.Int("expire_in", int(*response.Body.ExpireIn)))
	c.tokenCache.accessToken = accessToken
	c.tokenCache.expireAt = time.Now().Add(time.Duration(*response.Body.ExpireIn-300) * time.Second)

	return c.tokenCache.accessToken, nil
}

func (c *DingTalkClient) UpdateAIStreamCard(trackID, content string, isFinalize bool) error {
	accessToken, err := c.GetAccessToken()
	if err != nil {
		return fmt.Errorf("failed to get access token while updating interactive card: %w", err)
	}

	headers := &dingtalkcard_1_0.StreamingUpdateHeaders{
		XAcsDingtalkAccessToken: tea.String(accessToken),
	}
	request := &dingtalkcard_1_0.StreamingUpdateRequest{
		OutTrackId: tea.String(trackID),
		Guid:       tea.String(uuid.New().String()),
		Key:        tea.String("content"),
		Content:    tea.String(content),
		IsFull:     tea.Bool(true),
		IsFinalize: tea.Bool(isFinalize),
		IsError:    tea.Bool(false),
	}
	_, err = c.cardClient.StreamingUpdateWithOptions(request, headers, &util.RuntimeOptions{})
	if err != nil {
		return fmt.Errorf("failed to update card: %w", err)
	}
	return nil
}

func (c *DingTalkClient) OnChatBotMessageReceived(ctx context.Context, data *chatbot.BotCallbackDataModel) ([]byte, error) {
	question := data.Text.Content

	accessToken, err := c.GetAccessToken()
	if err != nil {
		return nil, err
	}

	createAndDeliverHeaders := &dingtalkcard_1_0.CreateAndDeliverHeaders{}
	createAndDeliverHeaders.XAcsDingtalkAccessToken = tea.String(accessToken)

	cardDataCardParamMap := map[string]*string{
		"content": tea.String(""),
	}
	cardData := &dingtalkcard_1_0.CreateAndDeliverRequestCardData{
		CardParamMap: cardDataCardParamMap,
	}
	trackID := uuid.New().String()

	createAndDeliverRequest := &dingtalkcard_1_0.CreateAndDeliverRequest{
		CardTemplateId: tea.String(c.TemplateID),
		OutTrackId:     tea.String(trackID),
		CardData:       cardData,
		CallbackType:   tea.String("STREAM"),
		ImGroupOpenSpaceModel: &dingtalkcard_1_0.CreateAndDeliverRequestImGroupOpenSpaceModel{
			SupportForward: tea.Bool(true),
		},
		ImRobotOpenSpaceModel: &dingtalkcard_1_0.CreateAndDeliverRequestImRobotOpenSpaceModel{
			SupportForward: tea.Bool(true),
		},
		UserIdType: tea.Int32(1),
	}
	if data.ConversationType == "2" {
		openSpaceId := fmt.Sprintf("dtv1.card//%s.%s", "IM_GROUP", data.ConversationId)
		createAndDeliverRequest.SetOpenSpaceId(openSpaceId)
		createAndDeliverRequest.SetImGroupOpenDeliverModel(
			&dingtalkcard_1_0.CreateAndDeliverRequestImGroupOpenDeliverModel{
				RobotCode: tea.String(c.ClientID),
			})
	} else if data.ConversationType == "1" {
		openSpaceId := fmt.Sprintf("dtv1.card//%s.%s", "IM_ROBOT", data.SenderStaffId)
		createAndDeliverRequest.SetOpenSpaceId(openSpaceId)
		createAndDeliverRequest.SetImRobotOpenDeliverModel(&dingtalkcard_1_0.CreateAndDeliverRequestImRobotOpenDeliverModel{
			SpaceType: tea.String("IM_GROUP"),
		})
	} else {
		c.logger.Error("invalid conversation type", log.String("conversation_type", data.ConversationType))
		return nil, fmt.Errorf("invalid conversation type: %s", data.ConversationType)
	}

	_, err = c.cardClient.CreateAndDeliverWithOptions(createAndDeliverRequest, createAndDeliverHeaders, &util.RuntimeOptions{})
	if err != nil {
		c.logger.Error("CreateAndDeliver", log.Error(err))
		return nil, fmt.Errorf("failed to create and deliver card: %w", err)
	}

	initialContent := fmt.Sprintf("**%s**\n\n%s", question, "稍等，让我想一想……")

	if err := c.UpdateAIStreamCard(trackID, initialContent, false); err != nil {
		c.logger.Error("UpdateInteractiveCard", log.Error(err))
		c.UpdateAIStreamCard(trackID, "出错了，请稍后再试", true)
	}

	contentCh := make(chan string)
	updateTicker := time.NewTicker(1500 * time.Millisecond)
	defer updateTicker.Stop()

	go func() {
		err = c.getQA(ctx, question, contentCh)
		if err != nil {
			contentCh <- err.Error()
		}
		close(contentCh)
	}()

	ans := fmt.Sprintf("**%s**\n\n", question)
	fullContent := fmt.Sprintf("**%s**\n\n", question)
	for {
		select {
		case content, ok := <-contentCh:
			if !ok {
				if err := c.UpdateAIStreamCard(trackID, fullContent, true); err != nil {
					c.logger.Error("UpdateInteractiveCard", log.Error(err))
					c.UpdateAIStreamCard(trackID, "出错了，请稍后再试", true)
				}
				return []byte(""), nil
			}
			fullContent += content
		case <-updateTicker.C:
			if fullContent == ans {
				continue
			}
			if err := c.UpdateAIStreamCard(trackID, fullContent, false); err != nil {
				c.logger.Error("UpdateInteractiveCard", log.Error(err))
				c.UpdateAIStreamCard(trackID, "出错了，请稍后再试", true)
			}
		}
	}
}

func (c *DingTalkClient) Start() error {
	cli := client.NewStreamClient(client.WithAppCredential(client.NewAppCredentialConfig(
		c.ClientID,
		c.ClientSecret,
	)))
	cli.RegisterChatBotCallbackRouter(c.OnChatBotMessageReceived)
	if err := cli.Start(c.ctx); err != nil {
		return err
	}

	<-c.ctx.Done()

	return nil
}

func (c *DingTalkClient) Stop() {
	c.cancel()
}
