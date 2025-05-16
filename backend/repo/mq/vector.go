package mq

import (
	"context"
	"encoding/json"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/mq"
)

type VectorRepository struct {
	producer mq.MQProducer
}

func NewVectorRepository(producer mq.MQProducer) *VectorRepository {
	return &VectorRepository{producer: producer}
}

func (r *VectorRepository) UpdateRecords(ctx context.Context, request []*domain.DocVectorContentRequest) error {
	for _, req := range request {
		requestBytes, err := json.Marshal(req)
		if err != nil {
			return err
		}
		if err := r.producer.Produce(ctx, domain.VectorTaskTopic, "", requestBytes); err != nil {
			return err
		}
	}
	return nil
}
