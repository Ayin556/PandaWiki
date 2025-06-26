package share

import "github.com/google/wire"

type ShareHandler struct {
	ShareNodeHandler    *ShareNodeHandler
	ShareAppHandler     *ShareAppHandler
	ShareChatHandler    *ShareChatHandler
	ShareSitemapHandler *ShareSitemapHandler
	ShareStatHandler    *ShareStatHandler
}

var ProviderSet = wire.NewSet(
	NewShareNodeHandler,
	NewShareAppHandler,
	NewShareChatHandler,
	NewShareSitemapHandler,
	NewShareStatHandler,

	wire.Struct(new(ShareHandler), "*"),
)
