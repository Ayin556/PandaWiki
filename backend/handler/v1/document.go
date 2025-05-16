package v1

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/usecase"
	"github.com/chaitin/panda-wiki/utils"
)

type DocHandler struct {
	*handler.BaseHandler
	logger  *log.Logger
	usecase *usecase.DocUsecase
	auth    middleware.AuthMiddleware
}

func NewDocHandler(
	baseHandler *handler.BaseHandler,
	echo *echo.Echo,
	usecase *usecase.DocUsecase,
	auth middleware.AuthMiddleware,
	logger *log.Logger,
) *DocHandler {
	h := &DocHandler{
		BaseHandler: baseHandler,
		logger:      logger.WithModule("handler.v1.document"),
		usecase:     usecase,
		auth:        auth,
	}

	group := echo.Group("/api/v1/doc", h.auth.Authorize)
	group.GET("/list", h.GetDocList)
	group.POST("", h.CreateDoc)
	group.GET("/detail", h.GetDocDetail)
	group.POST("/action", h.DocAction)
	group.PUT("/detail", h.UpdateDocDetail)
	group.POST("/parse_url", h.ParseURL)
	group.GET("/chunk/list", h.GetChunkList)

	return h
}

// Get Doc List
//
//	@Summary		Get Doc List
//	@Description	Get Doc List
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			params	query		domain.GetDocListReq	true	"Params"
//	@Success		200		{object}	domain.Response{data=[]domain.DocListItemResp}
//	@Router			/api/v1/doc/list [get]
func (h *DocHandler) GetDocList(c echo.Context) error {
	var req domain.GetDocListReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "invalid request", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request params failed", err)
	}
	ctx := c.Request().Context()
	docs, err := h.usecase.GetList(ctx, &req)
	if err != nil {
		return h.NewResponseWithError(c, "get doc list failed", err)
	}
	return h.NewResponseWithData(c, docs)
}

// Create Doc
//
//	@Summary		Create Doc
//	@Description	Create Doc
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.CreateDocReq	true	"Doc"
//	@Success		200		{object}	domain.Response{data=map[string]string}
//	@Router			/api/v1/doc [post]
func (h *DocHandler) CreateDoc(c echo.Context) error {
	req := &domain.CreateDocReq{}
	if err := c.Bind(req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}
	docs := make([]*domain.Document, 0)
	now := time.Now()
	docIDs := make(map[string]string, 0)
	switch req.Source { // url, file, manual
	case domain.DocSourceURL:
		urls := lo.Uniq(req.URL)
		if len(urls) == 0 {
			return h.NewResponseWithError(c, "urls is required", nil)
		}
		// generate doc ids for urls
		for _, url := range urls {
			docID, err := uuid.NewV7()
			if err != nil {
				return h.NewResponseWithError(c, "create doc id failed", err)
			}
			docIDs[url] = docID.String()
			doc := &domain.Document{
				ID:        docID.String(),
				KBID:      req.KBID,
				Source:    domain.DocSourceURL,
				URL:       url,
				Status:    domain.DocStatusPending,
				Meta:      domain.DocMeta{},
				CreatedAt: now,
				UpdatedAt: now,
			}
			docs = append(docs, doc)
		}
	case domain.DocSourceFile:
		fileKeys := lo.Uniq(req.FileKey)
		if len(fileKeys) == 0 {
			return h.NewResponseWithError(c, "file keys is required", nil)
		}
		for _, fileKey := range fileKeys {
			docID, err := uuid.NewV7()
			if err != nil {
				return h.NewResponseWithError(c, "create doc id failed", err)
			}
			docIDs[fileKey] = docID.String()
			docs = append(docs, &domain.Document{
				ID:        docID.String(),
				KBID:      req.KBID,
				Source:    domain.DocSourceFile,
				URL:       fileKey,
				Status:    domain.DocStatusPending,
				Meta:      domain.DocMeta{},
				CreatedAt: now,
				UpdatedAt: now,
			})
		}
	case domain.DocSourceManual:
		docID, err := uuid.NewV7()
		if err != nil {
			return h.NewResponseWithError(c, "create doc id failed", err)
		}
		docIDs[req.Content] = docID.String()
		content := req.Content
		if len(content) > 20000 {
			return h.NewResponseWithError(c, "content is too long", nil)
		}
		title := req.Title
		if len(title) > 100 {
			return h.NewResponseWithError(c, "title is too long", nil)
		}
		docs = append(docs, &domain.Document{
			ID:           docID.String(),
			KBID:         req.KBID,
			Source:       domain.DocSourceManual,
			ResourceType: domain.ResourceTypePlainText,
			URL:          docID.String(),
			Status:       domain.DocStatusPending,
			Content:      content,
			Meta:         domain.DocMeta{Title: title},
			CreatedAt:    now,
			UpdatedAt:    now,
		})
	}
	if len(docs) == 0 {
		return h.NewResponseWithError(c, "no docs created", nil)
	}
	successDocIDs, err := h.usecase.Create(c.Request().Context(), docs)
	if err != nil {
		return h.NewResponseWithError(c, "create doc failed", err)
	}
	return h.NewResponseWithData(c, map[string]any{
		"ids": lo.Keys(successDocIDs),
	})
}

// Get Doc Detail
//
//	@Summary		Get Doc Detail
//	@Description	Get Doc Detail
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			doc_id	query		string	true	"Doc ID"
//	@Success		200		{object}	domain.Response{data=domain.DocDetailResp}
//	@Router			/api/v1/doc/detail [get]
func (h *DocHandler) GetDocDetail(c echo.Context) error {
	docID := c.QueryParam("doc_id")
	if docID == "" {
		return h.NewResponseWithError(c, "doc id is required", nil)
	}
	doc, err := h.usecase.GetByID(c.Request().Context(), docID)
	if err != nil {
		return h.NewResponseWithError(c, "get doc detail failed", err)
	}
	return h.NewResponseWithData(c, doc)
}

// Doc Action
//
//	@Summary		Doc Action
//	@Description	Doc Action
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			action	body		domain.DocActionReq	true	"Action"
//	@Success		200		{object}	domain.Response{data=map[string]string}
//	@Router			/api/v1/doc/action [post]
func (h *DocHandler) DocAction(c echo.Context) error {
	req := &domain.DocActionReq{}
	if err := c.Bind(req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}
	reqDocIDs := lo.Uniq(req.DocIDs)
	if len(reqDocIDs) == 0 {
		return h.NewResponseWithError(c, "doc ids is required", nil)
	}
	ctx := c.Request().Context()
	if err := h.usecase.DocAction(ctx, reqDocIDs, req.Action); err != nil {
		return h.NewResponseWithError(c, "doc action failed", err)
	}
	return h.NewResponseWithData(c, nil)
}

// Update Doc Detail
//
//	@Summary		Update Doc Detail
//	@Description	Update Doc Detail
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			doc	body		domain.UpdateDocReq	true	"Doc"
//	@Success		200	{object}	domain.Response
//	@Router			/api/v1/doc/detail [put]
func (h *DocHandler) UpdateDocDetail(c echo.Context) error {
	req := &domain.UpdateDocReq{}
	if err := c.Bind(req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}
	ctx := c.Request().Context()
	if err := h.usecase.Update(ctx, req); err != nil {
		return h.NewResponseWithError(c, "update doc detail failed", err)
	}
	return h.NewResponseWithData(c, nil)
}

// Parse URL
//
//	@Summary		Parse URL
//	@Description	Parse URL
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			body	body		domain.ParseURLReq	true	"Parse URL"
//	@Success		200		{object}	domain.Response{data=domain.ParseURLResp}
//	@Router			/api/v1/doc/parse_url [post]
func (h *DocHandler) ParseURL(c echo.Context) error {
	var req domain.ParseURLReq
	if err := c.Bind(&req); err != nil {
		return h.NewResponseWithError(c, "request body is invalid", err)
	}
	if err := c.Validate(req); err != nil {
		return h.NewResponseWithError(c, "validate request body failed", err)
	}
	resp, err := http.Get(req.URL)
	if err != nil {
		return h.NewResponseWithError(c, "parse url failed", err)
	}
	defer resp.Body.Close()

	switch req.Type {
	case "RSS":
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
	case "Sitemap":
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
	default:
		return h.NewResponseWithError(c, "invalid parse url type", nil)
	}
}

// Get Chunk List
//
//	@Summary		Get Chunk List
//	@Description	Get Chunk List
//	@Tags			doc
//	@Accept			json
//	@Produce		json
//	@Param			doc_id	query		string	true	"Doc ID"
//	@Success		200		{object}	domain.Response{data=[]domain.ChunkListItemResp}
//	@Router			/api/v1/doc/chunk/list [get]
func (h *DocHandler) GetChunkList(c echo.Context) error {
	docID := c.QueryParam("doc_id")
	if docID == "" {
		return h.NewResponseWithError(c, "doc id is required", nil)
	}
	chunks, err := h.usecase.GetChunkList(c.Request().Context(), docID)
	if err != nil {
		return h.NewResponseWithError(c, "get chunk list failed", err)
	}
	return h.NewResponseWithData(c, chunks)
}
