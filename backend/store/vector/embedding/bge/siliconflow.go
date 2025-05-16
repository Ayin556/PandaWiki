package bge

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/log"
)

type SiliconFlowRequest struct {
	Model          string   `json:"model"`
	Input          []string `json:"input"`
	EncodingFormat string   `json:"encoding_format"`
	IsQuery        bool     `json:"is_query"`
}

type SiliconFlowResponse struct {
	Object string `json:"object"`
	Data   []struct {
		Object    string    `json:"object"`
		Embedding []float64 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
	Model string `json:"model"`
}

type RerankRequest struct {
	Model           string   `json:"model"`
	Query           string   `json:"query"`
	Documents       []string `json:"documents"`
	TopN            int      `json:"top_n"`
	ReturnDocuments bool     `json:"return_documents"`
	MaxChunksPerDoc int      `json:"max_chunks_per_doc"`
	OverlapTokens   int      `json:"overlap_tokens"`
}

type RerankResponse struct {
	Results []struct {
		Index int     `json:"index"`
		Score float64 `json:"relevance_score"`
	} `json:"results"`
}

type BGE struct {
	host           string
	token          string
	embeddingModel string
	rerankModel    string
	logger         *log.Logger
	config         *config.Config
}

func NewBGE(config *config.Config, logger *log.Logger) (*BGE, error) {
	return &BGE{
		host:           config.Embedding.BGE.Host,
		token:          config.Embedding.BGE.Token,
		embeddingModel: config.Embedding.BGE.EmbeddingModel,
		rerankModel:    config.Embedding.BGE.RerankModel,
		logger:         logger.WithModule("embedding.bge"),
		config:         config,
	}, nil
}

func (b *BGE) Embed(texts []string, isQuery bool) ([][]float64, error) {
	url := fmt.Sprintf("%s/v1/embeddings", b.host)
	reqBody := SiliconFlowRequest{
		Model:          b.embeddingModel,
		Input:          texts,
		EncodingFormat: "float",
		IsQuery:        isQuery,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+b.token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result SiliconFlowResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error unmarshaling response: %v", err)
	}

	embeddings := make([][]float64, len(result.Data))
	for i, data := range result.Data {
		embeddings[i] = data.Embedding
	}

	return embeddings, nil
}

func (b *BGE) Rerank(query string, texts []string, topK int) ([]int, []float64, error) {
	url := fmt.Sprintf("%s/v1/rerank", b.host)

	reqBody := RerankRequest{
		Model:           b.rerankModel,
		Query:           query,
		Documents:       texts,
		TopN:            topK,
		ReturnDocuments: false,
		MaxChunksPerDoc: 1024,
		OverlapTokens:   80,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, nil, fmt.Errorf("error marshaling request: %v", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("Authorization", "Bearer "+b.token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("error reading response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var result RerankResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, nil, fmt.Errorf("error unmarshaling response: %v", err)
	}

	indices := make([]int, 0)
	scores := make([]float64, 0)
	for _, res := range result.Results {
		if res.Score > b.config.Embedding.RerankScoreThreshold {
			indices = append(indices, res.Index)
			scores = append(scores, res.Score)
		}
	}

	return indices, scores, nil
}
