package bot

import "context"

type GetQAFun func(ctx context.Context, msg string, ConversatonID string) (chan string, error)
