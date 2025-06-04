package mq

import (
	"github.com/google/wire"

	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/rag"
	"github.com/chaitin/panda-wiki/usecase"
)

type MQHandlers struct {
	RAGMQHandler *RAGMQHandler
}

var ProviderSet = wire.NewSet(
	pg.ProviderSet,
	rag.ProviderSet,
	mq.ProviderSet,
	usecase.NewLLMUsecase,

	NewRAGMQHandler,

	wire.Struct(new(MQHandlers), "*"),
)
