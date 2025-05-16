package usecase

import (
	"github.com/google/wire"

	mqRepo "github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/vector"
)

var ProviderSet = wire.NewSet(
	pg.ProviderSet,
	mqRepo.ProviderSet,
	vector.ProviderSet,

	NewLLMUsecase,
	NewDocUsecase,
	NewAppUsecase,
	NewConversationUsecase,
	NewUserUsecase,
	NewModelUsecase,
	NewKnowledgeBaseUsecase,
)
