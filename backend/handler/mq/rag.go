package mq

import (
	"context"
	"encoding/json"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/mq"
	"github.com/chaitin/panda-wiki/mq/types"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/store/rag"
)

type RAGMQHandler struct {
	consumer mq.MQConsumer
	logger   *log.Logger
	rag      rag.RAGService
	nodeRepo *pg.NodeRepository
	kbRepo   *pg.KnowledgeBaseRepository
}

func NewRAGMQHandler(consumer mq.MQConsumer, logger *log.Logger, rag rag.RAGService, nodeRepo *pg.NodeRepository, kbRepo *pg.KnowledgeBaseRepository) (*RAGMQHandler, error) {
	h := &RAGMQHandler{
		consumer: consumer,
		logger:   logger.WithModule("mq.vector"),
		rag:      rag,
		nodeRepo: nodeRepo,
		kbRepo:   kbRepo,
	}
	if err := consumer.RegisterHandler(domain.VectorTaskTopic, h.HandleNodeContentVectorRequest); err != nil {
		return nil, err
	}
	return h, nil
}

func (h *RAGMQHandler) HandleNodeContentVectorRequest(ctx context.Context, msg types.Message) error {
	var request domain.NodeContentVectorRequest
	err := json.Unmarshal(msg.GetData(), &request)
	if err != nil {
		h.logger.Error("unmarshal node content vector request failed", log.Error(err))
		return nil
	}
	switch request.Action {
	case "upsert":
		h.logger.Debug("upsert node content vector request", "request", request)
		node, err := h.nodeRepo.GetNodeByID(ctx, request.ID)
		if err != nil {
			h.logger.Error("get node content by ids failed", log.Error(err))
			return err
		}
		kb, err := h.kbRepo.GetKnowledgeBaseByID(ctx, request.KBID)
		if err != nil {
			h.logger.Error("get kb failed", log.Error(err))
			return err
		}
		// upsert node content chunks
		docID, err := h.rag.UpsertRecords(ctx, kb.DatasetID, node)
		if err != nil {
			h.logger.Error("upsert node content vector failed", log.Error(err))
			return err
		}
		// update node doc_id
		if err := h.nodeRepo.UpdateNodeDocID(ctx, request.ID, docID); err != nil {
			h.logger.Error("update node doc_id failed", log.String("node_id", request.ID), log.Error(err))
			return err
		}
		h.logger.Info("upsert node content vector success", log.Any("updated_ids", request.ID))

	case "delete":
		h.logger.Info("delete node content vector request", log.Any("request", request))
		kb, err := h.kbRepo.GetKnowledgeBaseByID(ctx, request.KBID)
		if err != nil {
			h.logger.Error("get kb failed", log.Error(err))
			return err
		}
		if err := h.rag.DeleteRecords(ctx, kb.DatasetID, []string{request.DocID}); err != nil {
			h.logger.Error("delete node content vector failed", log.Error(err))
			return err
		}
		h.logger.Info("delete node content vector success", log.Any("deleted_id", request.ID), log.Any("deleted_doc_id", request.DocID))
	}

	return nil
}
