package v1

import (
	"github.com/labstack/echo/v4"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
	"github.com/chaitin/panda-wiki/utils"
)

type CrawlerHandler struct {
	*handler.BaseHandler
	logger  *log.Logger
	usecase *usecase.CrawlerUsecase
	config  *config.Config
}

func NewCrawlerHandler(echo *echo.Echo, baseHandler *handler.BaseHandler, auth middleware.AuthMiddleware, logger *log.Logger, config *config.Config, usecase *usecase.CrawlerUsecase) *CrawlerHandler {
	h := &CrawlerHandler{
		BaseHandler: baseHandler,
		logger:      logger,
		config:      config,
		usecase:     usecase,
	}
	group := echo.Group("/api/v1/crawler", auth.Authorize)
	group.POST("/parse_rss", h.ParseRSS)
	group.POST("/parse_sitemap", h.ParseSitemap)
	group.POST("/scrape", h.Scrape)

	return h
}

// Parse RSS
//
//	@Summary		Parse RSS
//	@Description	Parse RSS
//	@Tags			crawler
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.ParseURLReq	true	"Parse URL"
//	@Success		200		{object}	domain.Response{data=domain.ParseURLResp}
//	@Router			/api/v1/crawler/parse_rss [post]
func (h *CrawlerHandler) ParseRSS(c echo.Context) error {
	var req domain.ParseURLReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	feed, err := utils.ParseFeed(req.URL)
	if err != nil {
		return h.NewResponseWithError(c, "parse rss url failed", err)
	}
	items := make([]domain.ParseURLItem, 0)
	for _, item := range feed.Items {
		items = append(items, domain.ParseURLItem{
			URL:       item.Link,
			Title:     item.Title,
			Desc:      item.Description,
			Published: item.Published,
		})
	}
	return h.NewResponseWithData(c, domain.ParseURLResp{
		Items: items,
	})
}

// Parse Sitemap
//
//	@Summary		Parse Sitemap
//	@Description	Parse Sitemap
//	@Tags			crawler
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.ParseURLReq	true	"Parse URL"
//	@Success		200		{object}	domain.Response{data=domain.ParseURLResp}
//	@Router			/api/v1/crawler/parse_sitemap [post]
func (h *CrawlerHandler) ParseSitemap(c echo.Context) error {
	var req domain.ParseURLReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}

	links, err := utils.ParseSitemap(req.URL)
	if err != nil {
		return h.NewResponseWithError(c, "parse sitemap url failed", err)
	}
	items := make([]domain.ParseURLItem, 0)
	for _, link := range links {
		items = append(items, domain.ParseURLItem{
			URL: link,
		})
	}
	return h.NewResponseWithData(c, domain.ParseURLResp{
		Items: items,
	})
}

// Scrape
//
//	@Summary		Scrape
//	@Description	Scrape
//	@Tags			crawler
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.ScrapeReq	true	"Scrape"
//	@Success		200		{object}	domain.Response{data=domain.ScrapeResp}
//	@Router			/api/v1/crawler/scrape [post]
func (h *CrawlerHandler) Scrape(c echo.Context) error {
	var req domain.ScrapeReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}
	resp, err := h.usecase.ScrapeURL(c.Request().Context(), req.URL)
	if err != nil {
		return h.NewResponseWithError(c, "scrape url failed", err)
	}
	return h.NewResponseWithData(c, resp)
}
