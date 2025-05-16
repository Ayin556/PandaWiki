package mq

import (
	"github.com/google/wire"

	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/vector"
	"github.com/chaitin/panda-wiki/usecase"
)

type MQHandlers struct {
	DocMQHandler    *DocMQHandler
	VectorMQHandler *VectorMQHandler
}

var ProviderSet = wire.NewSet(
	pg.ProviderSet,
	vector.ProviderSet,
	mq.ProviderSet,
	usecase.NewLLMUsecase,

	NewDocMQHandler,
	NewVectorMQHandler,

	wire.Struct(new(MQHandlers), "*"),
)
