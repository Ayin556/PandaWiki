package v1

import (
	"github.com/google/wire"

	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/store/s3"
	"github.com/chaitin/panda-wiki/usecase"
)

type APIHandlers struct {
	UserHandler          *UserHandler
	KnowledgeBaseHandler *KnowledgeBaseHandler
	NodeHandler          *NodeHandler
	AppHandler           *AppHandler
	FileHandler          *FileHandler
	ModelHandler         *ModelHandler
	ConversationHandler  *ConversationHandler
	CrawlerHandler       *CrawlerHandler
	CreationHandler      *CreationHandler
}

var ProviderSet = wire.NewSet(
	middleware.ProviderSet,
	usecase.ProviderSet,
	s3.ProviderSet,

	handler.NewBaseHandler,
	NewNodeHandler,
	NewAppHandler,
	NewConversationHandler,
	NewUserHandler,
	NewFileHandler,
	NewModelHandler,
	NewKnowledgeBaseHandler,
	NewCrawlerHandler,
	NewCreationHandler,

	wire.Struct(new(APIHandlers), "*"),
)
