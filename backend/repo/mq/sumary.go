package mq

import (
	"context"
	"encoding/json"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/mq"
)

type SummaryRepository struct {
	producer mq.MQProducer
}

func NewSummaryRepository(producer mq.MQProducer) *SummaryRepository {
	return &SummaryRepository{producer: producer}
}

func (r *SummaryRepository) Summarize(ctx context.Context, pageIDs []string) error {
	for _, pageID := range pageIDs {
		request := &domain.PageSummaryRequest{
			PageID: pageID,
		}
		requestBytes, err := json.Marshal(request)
		if err != nil {
			return err
		}
		if err := r.producer.Produce(ctx, domain.SummaryTaskTopic, request.PageID, requestBytes); err != nil {
			return err
		}
	}
	return nil
}
