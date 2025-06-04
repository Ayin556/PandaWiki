package share

import "github.com/google/wire"

type ShareHandler struct {
	ShareNodeHandler *ShareNodeHandler
	ShareAppHandler  *ShareAppHandler
	ShareChatHandler *ShareChatHandler
}

var ProviderSet = wire.NewSet(
	NewShareNodeHandler,
	NewShareAppHandler,
	NewShareChatHandler,

	wire.Struct(new(ShareHandler), "*"),
)
