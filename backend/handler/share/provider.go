package share

import "github.com/google/wire"

type ShareHandler struct {
	ShareNodeHandler    *ShareNodeHandler
	ShareAppHandler     *ShareAppHandler
	ShareChatHandler    *ShareChatHandler
	ShareSitemapHandler *ShareSitemapHandler
	ShareStatHandler    *ShareStatHandler
	ShareCommentHandler *ShareCommentHandler
	ShareAuthHandler    *ShareAuthHandler
}

var ProviderSet = wire.NewSet(
	NewShareNodeHandler,
	NewShareAppHandler,
	NewShareChatHandler,
	NewShareSitemapHandler,
	NewShareStatHandler,
	NewShareCommentHandler,
	NewShareAuthHandler,

	wire.Struct(new(ShareHandler), "*"),
)
