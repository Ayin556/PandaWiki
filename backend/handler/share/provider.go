package share

import "github.com/google/wire"

type ShareHandler struct {
	ShareNodeHandler    *ShareNodeHandler
	ShareAppHandler     *ShareAppHandler
	ShareChatHandler    *ShareChatHandler
	ShareSitemapHandler *ShareSitemapHandler
}

var ProviderSet = wire.NewSet(
	NewShareNodeHandler,
	NewShareAppHandler,
	NewShareChatHandler,
	NewShareSitemapHandler,

	wire.Struct(new(ShareHandler), "*"),
)
