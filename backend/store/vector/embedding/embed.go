package embedding

import (
	"fmt"

	"github.com/tmc/langchaingo/textsplitter"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/vector/embedding/bge"
)

type Embedding interface {
	Embed(text []string, isQuery bool) ([][]float64, error)
	Rerank(query string, texts []string, topK int) ([]int, []float64, error)
}

func SplitText(text string, maxSize int) ([]string, error) {
	textSplitter := textsplitter.NewRecursiveCharacter(
		textsplitter.WithChunkSize(maxSize),
	)
	chunks, err := textSplitter.SplitText(text)
	if err != nil {
		return nil, err
	}
	return chunks, nil
}

func NewEmbedding(config *config.Config, logger *log.Logger) (Embedding, error) {
	switch config.Embedding.Provider {
	case "bge":
		return bge.NewBGE(config, logger)
	default:
		return nil, fmt.Errorf("unsupported embedding provider: %s", config.Embedding.Provider)
	}
}
