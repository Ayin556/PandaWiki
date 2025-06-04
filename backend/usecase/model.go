package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"github.com/cloudwego/eino/schema"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/mq"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/rag"
	"github.com/chaitin/panda-wiki/utils"
)

type ModelUsecase struct {
	modelRepo *pg.ModelRepository
	logger    *log.Logger
	config    *config.Config
	nodeRepo  *pg.NodeRepository
	ragRepo   *mq.RAGRepository
	ragStore  rag.RAGService
}

func NewModelUsecase(modelRepo *pg.ModelRepository, nodeRepo *pg.NodeRepository, ragRepo *mq.RAGRepository, ragStore rag.RAGService, logger *log.Logger, config *config.Config) *ModelUsecase {
	return &ModelUsecase{
		modelRepo: modelRepo,
		logger:    logger.WithModule("usecase.model"),
		config:    config,
		nodeRepo:  nodeRepo,
		ragRepo:   ragRepo,
		ragStore:  ragStore,
	}
}

func (u *ModelUsecase) Create(ctx context.Context, model *domain.Model) error {
	if model.Type == domain.ModelTypeEmbedding || model.Type == domain.ModelTypeRerank {
		if id, err := u.ragStore.AddModel(ctx, model); err != nil {
			return err
		} else {
			model.ID = id
		}
	}
	if err := u.modelRepo.Create(ctx, model); err != nil {
		return err
	}
	if model.Type == domain.ModelTypeEmbedding {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}

func (u *ModelUsecase) GetList(ctx context.Context) ([]*domain.ModelListItem, error) {
	return u.modelRepo.GetList(ctx)
}

// trigger upsert records after embedding model is updated or created
func (u *ModelUsecase) TriggerUpsertRecords(ctx context.Context) error {
	// traverse all nodes
	err := u.nodeRepo.TraverseNodesByCursor(ctx, func(node *domain.Node) error {
		// async upsert vector content via mq
		nodeContentVectorRequests := []*domain.NodeContentVectorRequest{
			{
				KBID:   node.KBID,
				ID:     node.ID,
				Action: "upsert",
			},
		}
		if err := u.ragRepo.UpdateRecords(ctx, nodeContentVectorRequests); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (u *ModelUsecase) Get(ctx context.Context, id string) (*domain.ModelDetailResp, error) {
	return u.modelRepo.Get(ctx, id)
}

func (u *ModelUsecase) Update(ctx context.Context, req *domain.UpdateModelReq) error {
	if err := u.modelRepo.Update(ctx, req); err != nil {
		return err
	}
	if req.Type == domain.ModelTypeEmbedding || req.Type == domain.ModelTypeRerank {
		if err := u.ragStore.UpdateModel(ctx, &domain.Model{
			ID:      req.ID,
			Model:   req.Model,
			Type:    req.Type,
			BaseURL: req.BaseURL,
			APIKey:  req.APIKey,
		}); err != nil {
			return err
		}
	}
	if req.Type == domain.ModelTypeEmbedding {
		return u.TriggerUpsertRecords(ctx)
	}
	return nil
}

func (u *ModelUsecase) GetChatModel(ctx context.Context) (*domain.Model, error) {
	return u.modelRepo.GetChatModel(ctx)
}

func (u *ModelUsecase) UpdateUsage(ctx context.Context, modelID string, usage *schema.TokenUsage) error {
	return u.modelRepo.UpdateUsage(ctx, modelID, usage)
}

func (u *ModelUsecase) GetUserModelList(ctx context.Context, req *domain.GetProviderModelListReq) (*domain.GetProviderModelListResp, error) {
	switch provider := domain.ModelProvider(req.Provider); provider {
	case domain.ModelProviderBrandMoonshot, domain.ModelProviderBrandDeepSeek, domain.ModelProviderBrandAzureOpenAI:
		return &domain.GetProviderModelListResp{
			Models: domain.ModelProviderBrandModelsList[domain.ModelProvider(req.Provider)],
		}, nil
	case domain.ModelProviderBrandOpenAI:
		u, err := url.Parse(req.BaseURL)
		if err != nil {
			return nil, err
		}
		u.Path = "/v1/models"
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
		if err != nil {
			return nil, err
		}
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", req.APIKey))
		resp, err := http.DefaultClient.Do(request)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		type OpenAIResp struct {
			Object string `json:"object"`
			Data   []struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		var models OpenAIResp
		err = json.Unmarshal(body, &models)
		if err != nil {
			return nil, err
		}
		modelsList := make([]domain.ProviderModelListItem, 0)
		for _, model := range models.Data {
			modelsList = append(modelsList, domain.ProviderModelListItem{
				Model: model.ID,
			})
		}
		return &domain.GetProviderModelListResp{
			Models: modelsList,
		}, nil
	case domain.ModelProviderBrandOllama:
		// get from ollama http://10.10.16.24:11434/api/tags
		u, err := url.Parse(req.BaseURL)
		if err != nil {
			return nil, err
		}
		u.Path = "/api/tags"
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
		if err != nil {
			return nil, err
		}
		if req.APIHeader != "" {
			headers := utils.GetHeaderMap(req.APIHeader)
			for k, v := range headers {
				request.Header.Set(k, v)
			}
		}
		resp, err := http.DefaultClient.Do(request)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		var models domain.GetProviderModelListResp
		err = json.Unmarshal(body, &models)
		if err != nil {
			return nil, err
		}
		return &models, nil
	case domain.ModelProviderBrandSiliconFlow, domain.ModelProviderBrandBaiZhiCloud:
		if req.Type == domain.ModelTypeEmbedding || req.Type == domain.ModelTypeRerank {
			if provider == domain.ModelProviderBrandBaiZhiCloud {
				if req.Type == domain.ModelTypeEmbedding {
					return &domain.GetProviderModelListResp{
						Models: []domain.ProviderModelListItem{
							{
								Model: "bge-m3",
							},
						},
					}, nil
				} else {
					return &domain.GetProviderModelListResp{
						Models: []domain.ProviderModelListItem{
							{
								Model: "bge-reranker-v2-m3",
							},
						},
					}, nil
				}
			}
		}
		u, err := url.Parse(req.BaseURL)
		if err != nil {
			return nil, err
		}
		u.Path = "/v1/models"
		q := u.Query()
		q.Set("type", "text")
		q.Set("sub_type", "chat")
		u.RawQuery = q.Encode()
		request, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
		if err != nil {
			return nil, err
		}
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", req.APIKey))
		resp, err := http.DefaultClient.Do(request)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("failed to get models: %s", resp.Status)
		}
		type SiliconFlowModelResp struct {
			Object string `json:"object"`
			Data   []struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		var models SiliconFlowModelResp
		err = json.Unmarshal(body, &models)
		if err != nil {
			return nil, err
		}
		modelsList := make([]domain.ProviderModelListItem, 0, len(models.Data))
		for _, model := range models.Data {
			modelsList = append(modelsList, domain.ProviderModelListItem{
				Model: model.ID,
			})
		}
		return &domain.GetProviderModelListResp{
			Models: modelsList,
		}, nil
	default:
		return nil, fmt.Errorf("invalid provider: %s", req.Provider)
	}
}
