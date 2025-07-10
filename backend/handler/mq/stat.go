package mq

import (
	"context"

	"github.com/robfig/cron/v3"

	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/pg"
)

type StatCronHandler struct {
	logger   *log.Logger
	statRepo *pg.StatRepository
}

func NewStatCronHandler(logger *log.Logger, statRepo *pg.StatRepository) (*StatCronHandler, error) {
	h := &StatCronHandler{
		statRepo: statRepo,
		logger:   logger.WithModule("handler.mq.stat"),
	}
	cron := cron.New()
	if _, err := cron.AddFunc("1 */1 * * *", h.RemoveOldStatData); err != nil {
		h.logger.Error("failed to add cron job", log.Error(err))
		return nil, err
	}
	h.logger.Info("add cron job", log.String("cron_id", "remove_old_stat_data"))
	cron.Start()
	h.logger.Info("start cron job")
	return h, nil
}

// remove stat data older than 24 hours, execute every hour
func (h *StatCronHandler) RemoveOldStatData() {
	h.logger.Info("remove old stat data start")
	err := h.statRepo.RemoveOldData(context.Background())
	if err != nil {
		h.logger.Error("remove old stat data failed", log.Error(err))
	}
	h.logger.Info("remove old stat data successful")
}
