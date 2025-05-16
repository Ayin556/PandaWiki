package pg

import (
	"github.com/google/wire"

	"github.com/chaitin/panda-wiki/store/pg"
)

var ProviderSet = wire.NewSet(
	pg.ProviderSet,

	NewDocRepository,
	NewAppRepository,
	NewConversationRepository,
	NewUserRepository,
	NewUserAccessRepository,
	NewModelRepository,
	NewKnowledgeBaseRepository,
)
