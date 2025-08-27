package usecase

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"sort"
	"strconv"

	"github.com/samber/lo"

	v1 "github.com/chaitin/panda-wiki/api/stat/v1"
	"github.com/chaitin/panda-wiki/consts"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/repo/cache"
	"github.com/chaitin/panda-wiki/repo/ipdb"
	"github.com/chaitin/panda-wiki/repo/pg"
	"github.com/chaitin/panda-wiki/utils"
)

type StatUseCase struct {
	repo             *pg.StatRepository
	nodeRepo         *pg.NodeRepository
	conversationRepo *pg.ConversationRepository
	kbRepo           *pg.KnowledgeBaseRepository
	appRepo          *pg.AppRepository
	ipRepo           *ipdb.IPAddressRepo
	logger           *log.Logger
	geoCacheRepo     *cache.GeoRepo
	authRepo         *pg.AuthRepo
}

func NewStatUseCase(repo *pg.StatRepository, nodeRepo *pg.NodeRepository, conversationRepo *pg.ConversationRepository, appRepo *pg.AppRepository, ipRepo *ipdb.IPAddressRepo, geoCacheRepo *cache.GeoRepo, authRepo *pg.AuthRepo, kbRepo *pg.KnowledgeBaseRepository, logger *log.Logger) *StatUseCase {
	return &StatUseCase{
		repo:             repo,
		nodeRepo:         nodeRepo,
		conversationRepo: conversationRepo,
		appRepo:          appRepo,
		ipRepo:           ipRepo,
		geoCacheRepo:     geoCacheRepo,
		authRepo:         authRepo,
		kbRepo:           kbRepo,
		logger:           logger.WithModule("usecase.stats"),
	}
}

func (u *StatUseCase) RecordPage(ctx context.Context, stat *domain.StatPage) error {
	if err := u.repo.CreateStatPage(ctx, stat); err != nil {
		return err
	}
	remoteIP := stat.IP
	ipAddress, err := u.ipRepo.GetIPAddress(ctx, remoteIP)
	if err != nil {
		u.logger.Warn("get ip address failed", log.Error(err), log.String("ip", remoteIP), log.Int64("stat_id", stat.ID))
	} else {
		location := fmt.Sprintf("%s|%s|%s", ipAddress.Country, ipAddress.Province, ipAddress.City)
		if err := u.geoCacheRepo.SetGeo(ctx, stat.KBID, location); err != nil {
			u.logger.Warn("set geo cache failed", log.Error(err), log.Int64("stat_id", stat.ID), log.String("ip", remoteIP))
		}
	}
	return nil
}

func (u *StatUseCase) ValidateStatDay(statDay consts.StatDay, edition consts.LicenseEdition) error {
	switch statDay {
	case consts.StatDay1:
		return nil
	case consts.StatDay7:
		if edition < consts.LicenseEditionContributor {
			return domain.ErrPermissionDenied
		}
		return nil
	case consts.StatDay30, consts.StatDay90:
		if edition < consts.LicenseEditionEnterprise {
			return domain.ErrPermissionDenied
		}
		return nil
	default:
		u.logger.Error("stat day is invalid")
		return domain.ErrPermissionDenied
	}
}

func (u *StatUseCase) GetHotPages(ctx context.Context, kbID string, day consts.StatDay) ([]*domain.HotPage, error) {
	switch day {
	case consts.StatDay1:
		hotPages, err := u.repo.GetHotPages(ctx, kbID)
		if err != nil {
			return nil, err
		}
		nodeIDs := lo.Uniq(lo.Map(hotPages, func(page *domain.HotPage, _ int) string {
			return page.NodeID
		}))
		docNames, err := u.nodeRepo.GetNodeNameByNodeIDs(ctx, nodeIDs)
		if err != nil {
			return nil, err
		}
		for _, page := range hotPages {
			switch page.Scene {
			case domain.StatPageSceneNodeDetail:
				page.NodeName = docNames[page.NodeID]
			case domain.StatPageSceneWelcome:
				page.NodeName = "欢迎页"
			case domain.StatPageSceneChat:
				page.NodeName = "问答页"
			case domain.StatPageSceneLogin:
				page.NodeName = "登录页"
			}
		}
		return hotPages, nil
	case consts.StatDay7, consts.StatDay30, consts.StatDay90:
		hotPageMap, err := u.repo.GetHotPagesByHour(ctx, kbID, int64(day)*24)
		if err != nil {
			return nil, err
		}

		// 转换 map 为 slice 并排序
		var hotPages []*domain.HotPage
		var nodeIDs []string
		for pageKey, count := range hotPageMap {
			hotPages = append(hotPages, &domain.HotPage{
				NodeID:   pageKey,
				Count:    count,
				NodeName: pageKey,
			})
			if !slices.Contains(domain.StatPageSceneNames, pageKey) {
				nodeIDs = append(nodeIDs, pageKey)
			}
		}

		sort.Slice(hotPages, func(i, j int) bool {
			return hotPages[i].Count > hotPages[j].Count
		})

		if len(hotPages) > 10 {
			hotPages = hotPages[:10]
		}

		if len(nodeIDs) > 0 {
			docNames, err := u.nodeRepo.GetNodeNameByNodeIDs(ctx, nodeIDs)
			if err != nil {
				return nil, err
			}
			for _, page := range hotPages {
				if !slices.Contains(domain.StatPageSceneNames, page.NodeID) {
					name, ok := docNames[page.NodeID]
					if ok {
						page.NodeName = name
					}
				}
			}
		}

		return hotPages, nil
	default:
		return nil, errors.New("invalid stat day")
	}

}

func (u *StatUseCase) GetHotRefererHosts(ctx context.Context, kbID string, day consts.StatDay) ([]*domain.HotRefererHost, error) {
	switch day {
	case consts.StatDay1:
		return u.repo.GetHotRefererHosts(ctx, kbID)
	case consts.StatDay7, consts.StatDay30, consts.StatDay90:
		refererHostMap, err := u.repo.GetHotRefererHostsByHour(ctx, kbID, int64(day)*24)
		if err != nil {
			return nil, err
		}

		// 转换 map 为 slice 并排序
		var hotRefererHosts []*domain.HotRefererHost
		for host, count := range refererHostMap {
			hotRefererHosts = append(hotRefererHosts, &domain.HotRefererHost{
				RefererHost: host,
				Count:       count,
			})
		}

		// 按 count 降序排序
		sort.Slice(hotRefererHosts, func(i, j int) bool {
			return hotRefererHosts[i].Count > hotRefererHosts[j].Count
		})

		// 取前10个
		if len(hotRefererHosts) > 10 {
			hotRefererHosts = hotRefererHosts[:10]
		}

		return hotRefererHosts, nil
	default:
		return nil, errors.New("invalid stat day")
	}
}

func (u *StatUseCase) GetHotBrowsers(ctx context.Context, kbID string, day consts.StatDay) (*domain.HotBrowser, error) {
	switch day {
	case consts.StatDay1:
		hotBrowsers, err := u.repo.GetHotBrowsers(ctx, kbID)
		if err != nil {
			return nil, err
		}
		return hotBrowsers, nil
	case consts.StatDay7, consts.StatDay30, consts.StatDay90:
		hotBrowsers, err := u.repo.GetHotBrowsersByHour(ctx, kbID, int64(day)*24)
		if err != nil {
			return nil, err
		}
		return hotBrowsers, nil
	default:
		return nil, errors.New("invalid stat day")
	}
}

func (u *StatUseCase) GetStatCount(ctx context.Context, kbID string, day consts.StatDay) (*v1.StatCountResp, error) {
	count, err := u.repo.GetStatPageCount(ctx, kbID)
	if err != nil {
		return nil, err
	}

	conversationCount, err := u.conversationRepo.GetConversationCount(ctx, kbID)
	if err != nil {
		return nil, err
	}
	count.ConversationCount = conversationCount

	if day > consts.StatDay1 {
		countHour, err := u.repo.GetStatPageCountByHour(ctx, kbID, int64(day)*24)
		if err != nil {
			return nil, err
		}
		count.IPCount += countHour.IPCount
		count.ConversationCount += countHour.ConversationCount
		count.SessionCount += countHour.SessionCount
		count.PageVisitCount += countHour.PageVisitCount
	}

	return count, nil
}

func (u *StatUseCase) GetInstantCount(ctx context.Context, kbID string) ([]*domain.InstantCountResp, error) {
	instantCount, err := u.repo.GetInstantCount(ctx, kbID)
	if err != nil {
		return nil, err
	}
	return instantCount, nil
}

func (u *StatUseCase) GetInstantPages(ctx context.Context, kbID string) ([]*domain.InstantPageResp, error) {
	pages, err := u.repo.GetInstantPages(ctx, kbID)
	if err != nil {
		return nil, err
	}
	ips := lo.Map(pages, func(page *domain.InstantPageResp, _ int) string {
		return page.IP
	})
	ipAddresses, err := u.ipRepo.GetIPAddresses(ctx, ips)
	if err != nil {
		return nil, err
	}
	authIDs := make([]uint, 0, 10)
	for _, page := range pages {
		ipAddress, ok := ipAddresses[page.IP]
		if !ok {
			ipAddress = &domain.IPAddress{
				IP:       page.IP,
				Country:  "未知",
				Province: "未知",
				City:     "未知",
			}
		}
		page.IPAddress = *ipAddress
		if page.UserID != 0 {
			authIDs = append(authIDs, page.UserID)
		}
	}
	authMap, err := u.authRepo.GetAuthUserinfoByIDs(ctx, authIDs)
	if err != nil {
		u.logger.Error("get user info failed", log.Error(err))
	}
	nodeIDs := lo.Uniq(lo.Map(pages, func(page *domain.InstantPageResp, _ int) string {
		return page.NodeID
	}))
	docNames, err := u.nodeRepo.GetNodeNameByNodeIDs(ctx, nodeIDs)
	if err != nil {
		return nil, err
	}
	for _, page := range pages {
		switch page.Scene {
		case domain.StatPageSceneNodeDetail:
			page.NodeName = docNames[page.NodeID]
		case domain.StatPageSceneWelcome:
			page.NodeName = "欢迎页"
		case domain.StatPageSceneChat:
			page.NodeName = "问答页"
		case domain.StatPageSceneLogin:
			page.NodeName = "登录页"
		default:
			page.NodeName = "未知"
		}
		if _, ok := authMap[page.UserID]; ok {
			page.Info = &domain.AuthUserInfo{
				Username:  authMap[page.UserID].AuthUserInfo.Username,
				Email:     authMap[page.UserID].AuthUserInfo.Email,
				AvatarUrl: authMap[page.UserID].AuthUserInfo.AvatarUrl,
			}
		}
	}
	return pages, nil
}

func (u *StatUseCase) GetGeoCount(ctx context.Context, kbID string, day consts.StatDay) (map[string]int64, error) {
	switch day {
	case consts.StatDay1:
		geoCount, err := u.geoCacheRepo.GetLast24HourGeo(ctx, kbID)
		if err != nil {
			return nil, err
		}
		return geoCount, nil
	case consts.StatDay7, consts.StatDay30, consts.StatDay90:
		geoCount, err := u.geoCacheRepo.GetGeoByHour(ctx, kbID, int64(day)*24+1)
		if err != nil {
			return nil, err
		}
		return geoCount, nil
	default:
		return nil, errors.New("invalid stat day")
	}
}

func (u *StatUseCase) GetConversationDistribution(ctx context.Context, kbID string, day consts.StatDay) ([]domain.ConversationDistribution, error) {
	appMap, err := u.appRepo.GetAppList(ctx, kbID)
	if err != nil {
		return nil, err
	}

	switch day {
	case consts.StatDay1:
		distributions, err := u.conversationRepo.GetConversationDistribution(ctx, kbID)
		if err != nil {
			return nil, err
		}
		distributions = lo.Map(distributions, func(resp domain.ConversationDistribution, _ int) domain.ConversationDistribution {
			if dist, ok := appMap[resp.AppID]; ok {
				resp.AppType = dist.Type
			}
			return resp
		})
		return distributions, nil

	case consts.StatDay7, consts.StatDay30, consts.StatDay90:
		m, err := u.conversationRepo.GetConversationDistributionByHour(ctx, kbID, int64(day)*24+1)
		if err != nil {
			return nil, err
		}

		distributions := make([]domain.ConversationDistribution, 0)
		for k, v := range m {
			t, _ := strconv.Atoi(k)
			distributions = append(distributions, domain.ConversationDistribution{
				AppType: domain.AppType(t),
				Count:   v,
			})
		}

		return distributions, nil
	default:
		return nil, errors.New("invalid stat day")
	}
}

// AggregateHourlyStats 聚合上一小时的统计数据到stat_page_hours表
func (u *StatUseCase) AggregateHourlyStats(ctx context.Context) error {
	kbIds, err := u.kbRepo.GetKnowledgeBaseIds(ctx)
	if err != nil {
		return err
	}

	for _, kbId := range kbIds {

		statPageHour, err := u.repo.GetStatPageOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		conversationCount, err := u.repo.GetConversationCountOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		geoCount, err := u.repo.GetGeCountOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		distributions, err := u.repo.GetConversationDistributionOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		hotRefererHosts, err := u.repo.GetHotRefererHostOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		hotPages, err := u.repo.GetHotPagesOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		hotBrowsers, err := u.repo.GetHotBrowsersOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		hotOS, err := u.repo.GetHotOSOneHour(ctx, kbId)
		if err != nil {
			return err
		}

		statPageHour.KbID = kbId
		statPageHour.Hour = utils.GetTimeHourOffset(-1)
		statPageHour.ConversationCount = conversationCount

		statPageHour.GeoCount = geoCount
		statPageHour.ConversationDistribution = distributions
		statPageHour.HotRefererHost = hotRefererHosts
		statPageHour.HotPage = hotPages
		statPageHour.HotBrowser = hotBrowsers
		statPageHour.HotOS = hotOS

		if err := u.repo.CreateStatPageHour(ctx, statPageHour); err != nil {
			return err
		}
	}

	return nil
}

// CleanupOldHourlyStats 清理90天前的小时统计数据
func (u *StatUseCase) CleanupOldHourlyStats(ctx context.Context) error {
	return u.repo.CleanupOldHourlyStats(ctx)
}
