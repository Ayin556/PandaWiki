package dingtalk

import (
	"context"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/open-dingtalk/dingtalk-stream-sdk-go/chatbot"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	pwlog "github.com/chaitin/panda-wiki/log"
)

func newTestLogger() *pwlog.Logger {
	return &pwlog.Logger{
		Logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
}

func newTestDingTalkClient(t *testing.T) *DingTalkClient {
	t.Helper()

	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)

	client, err := NewDingTalkClient(
		ctx,
		cancel,
		"client-id",
		"client-secret",
		"template-id",
		newTestLogger(),
		nil,
	)
	require.NoError(t, err)

	client.messageTTL = time.Minute

	return client
}

func TestTryMarkMessageDeduplicatesWithinTTL(t *testing.T) {
	client := newTestDingTalkClient(t)

	now := time.Now()
	client.nowFunc = func() time.Time {
		return now
	}

	require.True(t, client.tryMarkMessage("msg-1"))
	require.False(t, client.tryMarkMessage("msg-1"))

	now = now.Add(client.messageTTL + time.Second)

	require.True(t, client.tryMarkMessage("msg-1"))
}

func TestOnChatBotMessageReceivedIgnoresDuplicateMsgID(t *testing.T) {
	client := newTestDingTalkClient(t)

	processed := make(chan struct{}, 2)
	client.processMessageFn = func(context.Context, *chatbot.BotCallbackDataModel) error {
		processed <- struct{}{}
		return nil
	}

	data := &chatbot.BotCallbackDataModel{
		MsgId: "msg-1",
		Text: chatbot.BotCallbackDataTextModel{
			Content: "hello",
		},
	}

	resp, err := client.OnChatBotMessageReceived(context.Background(), data)
	require.NoError(t, err)
	assert.Equal(t, []byte(""), resp)

	resp, err = client.OnChatBotMessageReceived(context.Background(), data)
	require.NoError(t, err)
	assert.Equal(t, []byte(""), resp)

	select {
	case <-processed:
	case <-time.After(time.Second):
		t.Fatal("expected first message to be processed")
	}

	select {
	case <-processed:
		t.Fatal("expected duplicate message to be ignored")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestOnChatBotMessageReceivedReturnsBeforeProcessingCompletes(t *testing.T) {
	client := newTestDingTalkClient(t)

	started := make(chan struct{})
	unblock := make(chan struct{})
	client.processMessageFn = func(context.Context, *chatbot.BotCallbackDataModel) error {
		close(started)
		<-unblock
		return nil
	}

	done := make(chan struct{})
	go func() {
		_, _ = client.OnChatBotMessageReceived(context.Background(), &chatbot.BotCallbackDataModel{
			MsgId: "msg-2",
			Text: chatbot.BotCallbackDataTextModel{
				Content: "slow question",
			},
		})
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(200 * time.Millisecond):
		t.Fatal("expected callback to return before background processing finishes")
	}

	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("expected background processing to start")
	}

	close(unblock)
}
