package v1

import (
	"fmt"
	"mime"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/minio/minio-go/v7"
	"github.com/samber/lo"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/handler"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/middleware"
	"github.com/chaitin/panda-wiki/store/s3"
)

type FileHandler struct {
	*handler.BaseHandler
	logger      *log.Logger
	auth        middleware.AuthMiddleware
	minioClient *s3.MinioClient
	config      *config.Config
}

func NewFileHandler(echo *echo.Echo, baseHandler *handler.BaseHandler, logger *log.Logger, auth middleware.AuthMiddleware, minioClient *s3.MinioClient, config *config.Config) *FileHandler {
	h := &FileHandler{
		BaseHandler: baseHandler,
		logger:      logger.WithModule("handler.v1.file"),
		auth:        auth,
		minioClient: minioClient,
		config:      config,
	}
	group := echo.Group("/api/v1/file", h.auth.Authorize)
	group.POST("/upload", h.Upload)
	return h
}

// Upload
//
//	@Summary		Upload File
//	@Description	Upload File
//	@Tags			file
//	@Accept			multipart/form-data
//	@Param			file	formData	file	true	"File"
//	@Param			kb_id	formData	string	false	"Knowledge Base ID"
//	@Success		200		{object}	domain.ObjectUploadResp
//	@Router			/api/v1/file/upload [post]
func (h *FileHandler) Upload(c echo.Context) error {
	cxt := c.Request().Context()
	kbID := c.FormValue("kb_id")
	if kbID == "" {
		kbID = uuid.New().String()
	}
	file, err := c.FormFile("file")
	if err != nil {
		return h.NewResponseWithError(c, "failed to get file", err)
	}

	src, err := file.Open()
	if err != nil {
		return h.NewResponseWithError(c, "failed to open file", err)
	}
	defer src.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		return h.NewResponseWithError(c, "file ext not supported", fmt.Errorf("file (%s) ext (%s) not supported", file.Filename, ext))
	}
	if !lo.Contains([]string{".html", ".htm", ".md", ".txt", ".pdf", ".xlsx", ".xls", ".docx", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".mpg", ".mpeg", ".3gp", ".ts", ".m2ts", ".vob", ".rm", ".rmvb"}, ext) {
		return h.NewResponseWithError(c, "file ext not supported", fmt.Errorf("file (%s) ext (%s) not supported", file.Filename, ext))
	}
	filename := fmt.Sprintf("%s/%s%s", kbID, uuid.New().String(), ext)

	maxSize := h.config.S3.MaxFileSize
	size := file.Size
	if size > int64(maxSize) { // 20MB
		return h.NewResponseWithError(c, "file size too large", nil)
	}

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = mime.TypeByExtension(ext)
	}

	resp, err := h.minioClient.PutObject(
		cxt,
		domain.Bucket,
		filename,
		src,
		size,
		minio.PutObjectOptions{
			ContentType: contentType,
			UserMetadata: map[string]string{
				"originalname": file.Filename,
			},
		},
	)
	if err != nil {
		return h.NewResponseWithError(c, "upload failed", err)
	}

	return h.NewResponseWithData(c, domain.ObjectUploadResp{
		Key: resp.Key,
	})
}
