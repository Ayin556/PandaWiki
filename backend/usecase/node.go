package usecase

import (
	"context"
	"fmt"

	"github.com/cloudwego/eino/schema"
	"github.com/samber/lo"
	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/s3"
)

type NodeUsecase struct {
	nodeRepo     *pg.NodeRepository
	ragRepo      *mq.RAGRepository
	llmUsecase   *LLMUsecase
	modelUsecase *ModelUsecase
	logger       *log.Logger
	s3Client     *s3.MinioClient
}

func NewNodeUsecase(nodeRepo *pg.NodeRepository, ragRepo *mq.RAGRepository, llmUsecase *LLMUsecase, modelUsecase *ModelUsecase, logger *log.Logger, s3Client *s3.MinioClient) *NodeUsecase {
	return &NodeUsecase{
		nodeRepo:     nodeRepo,
		ragRepo:      ragRepo,
		llmUsecase:   llmUsecase,
		modelUsecase: modelUsecase,
		logger:       logger,
		s3Client:     s3Client,
	}
}

func (u *NodeUsecase) Create(ctx context.Context, req *domain.CreateNodeReq) (string, error) {
	nodeID, err := u.nodeRepo.Create(ctx, req)
	if err != nil {
		return "", err
	}
	// async upsert vector content via mq
	nodeContentVectorRequests := []*domain.NodeContentVectorRequest{
		{
			KBID:   req.KBID,
			ID:     nodeID,
			Action: "upsert",
		},
	}
	if err := u.ragRepo.UpdateRecords(ctx, nodeContentVectorRequests); err != nil {
		return "", err
	}
	return nodeID, nil
}

func (u *NodeUsecase) GetList(ctx context.Context, req *domain.GetNodeListReq) ([]*domain.NodeListItemResp, error) {
	nodes, err := u.nodeRepo.GetList(ctx, req)
	if err != nil {
		return nil, err
	}
	return nodes, nil
}

func (u *NodeUsecase) GetByID(ctx context.Context, id string) (*domain.NodeDetailResp, error) {
	return u.nodeRepo.GetByID(ctx, id)
}

func (u *NodeUsecase) NodeAction(ctx context.Context, req *domain.NodeActionReq) error {
	switch req.Action {
	case "delete":
		if err := u.nodeRepo.Delete(ctx, req.KBID, req.ID); err != nil {
			return err
		}
		nodeVectorContentRequests := []*domain.NodeContentVectorRequest{
			{
				KBID:   req.KBID,
				ID:     req.ID,
				Action: "delete",
			},
		}
		if len(nodeVectorContentRequests) > 0 {
			if err := u.ragRepo.UpdateRecords(ctx, nodeVectorContentRequests); err != nil {
				return err
			}
		}
	}
	return nil
}

func (u *NodeUsecase) Update(ctx context.Context, req *domain.UpdateNodeReq) error {
	if err := u.nodeRepo.UpdateNodeContent(ctx, req); err != nil {
		return err
	}
	// async upsert vector content via mq
	nodeContentVectorRequests := []*domain.NodeContentVectorRequest{
		{
			KBID:   req.KBID,
			ID:     req.ID,
			Action: "upsert",
		},
	}
	if err := u.ragRepo.UpdateRecords(ctx, nodeContentVectorRequests); err != nil {
		return err
	}
	return nil
}

func (u *NodeUsecase) GetNodeListByKBID(ctx context.Context, kbID string) ([]*domain.ShareNodeListItemResp, error) {
	return u.nodeRepo.GetNodeListByKBID(ctx, kbID)
}

func (u *NodeUsecase) GetNodeDetailByKBIDAndID(ctx context.Context, kbID, id string) (*domain.NodeDetailResp, error) {
	return u.nodeRepo.GetNodeDetailByKBIDAndID(ctx, kbID, id)
}

func (u *NodeUsecase) MoveNode(ctx context.Context, req *domain.MoveNodeReq) error {
	return u.nodeRepo.MoveNodeBetween(ctx, req.ID, req.ParentID, req.PrevID, req.NextID)
}

func (u *NodeUsecase) SummaryNode(ctx context.Context, req *domain.NodeSummaryReq) (string, error) {
	node, err := u.nodeRepo.GetNodeDetailByKBIDAndID(ctx, req.KBID, req.ID)
	if err != nil {
		return "", err
	}
	model, err := u.modelUsecase.GetChatModel(ctx)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", domain.ErrModelNotConfigured
		} else {
			return "", err
		}
	}
	chatModel, err := u.llmUsecase.GetChatModel(ctx, model)
	if err != nil {
		return "", err
	}
	summary, err := u.llmUsecase.Generate(ctx, chatModel, []*schema.Message{
		{
			Role:    "system",
			Content: "你是文档总结助手，请根据文档内容总结出文档的摘要。摘要是纯文本，应该简洁明了，不要超过160个字。",
		},
		{
			Role:    "user",
			Content: fmt.Sprintf("文档名称：%s\n文档内容：%s", node.Name, node.Content),
		},
	})
	if err != nil {
		return "", err
	}
	if err := u.nodeRepo.UpdateNodeSummary(ctx, req.KBID, req.ID, summary); err != nil {
		return "", err
	}
	return summary, nil
}

func (u *NodeUsecase) GetRecommendNodeList(ctx context.Context, req *domain.GetRecommendNodeListReq) ([]*domain.RecommendNodeListResp, error) {
	nodes, err := u.nodeRepo.GetRecommendNodeListByIDs(ctx, req.KBID, req.NodeIDs)
	if err != nil {
		return nil, err
	}
	if len(nodes) > 0 {
		// sort nodes by req.NodeIDs order
		nodesMap := lo.SliceToMap(nodes, func(item *domain.RecommendNodeListResp) (string, *domain.RecommendNodeListResp) {
			return item.ID, item
		})
		nodes = make([]*domain.RecommendNodeListResp, 0)
		for _, id := range req.NodeIDs {
			if node, ok := nodesMap[id]; ok {
				nodes = append(nodes, node)
			}
		}
		// get folder nodes
		folderNodeIds := lo.Filter(nodes, func(item *domain.RecommendNodeListResp, _ int) bool {
			return item.Type == domain.NodeTypeFolder
		})
		if len(folderNodeIds) > 0 {
			parentIDNodeMap, err := u.nodeRepo.GetRecommendNodeListByParentIDs(ctx, req.KBID, lo.Map(folderNodeIds, func(item *domain.RecommendNodeListResp, _ int) string {
				return item.ID
			}))
			if err != nil {
				return nil, err
			}
			for _, node := range nodes {
				if parentNodes, ok := parentIDNodeMap[node.ID]; ok {
					node.RecommendNodes = parentNodes
				}
			}
		}
		return nodes, nil
	}
	return nil, nil
}
