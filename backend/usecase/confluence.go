package usecase

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"mime"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/base"
	"github.com/JohannesKaufmann/html-to-markdown/v2/plugin/commonmark"
	"github.com/google/uuid"
	"github.com/samber/lo"
	"github.com/samber/lo/parallel"

	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/s3"
	"github.com/chaitin/panda-wiki/utils"
)

type ConfluenceUsecase struct {
	logger      *log.Logger
	minioClient *s3.MinioClient
	crawler     *CrawlerUsecase
	file        *FileUsecase
}

func NewConfluenceUsecase(logger *log.Logger, minio *s3.MinioClient, crawler *CrawlerUsecase, file *FileUsecase) *ConfluenceUsecase {
	return &ConfluenceUsecase{
		logger:      logger.WithModule("usecase.confluenceusecase"),
		minioClient: minio,
		crawler:     crawler,
		file:        file,
	}
}

func (c *ConfluenceUsecase) Analysis(ctx context.Context, data []byte, kbid string) ([]domain.AnalysisConfluenceResp, error) {
	r := bytes.NewReader(data)
	zipReader, err := zip.NewReader(r, int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("failed to read zip file: %w", err)
	}

	// First pass: process resource files concurrently
	resourceFiles := make([]*zip.File, 0)
	for _, zipfile := range zipReader.File {
		if strings.HasPrefix(zipfile.Name, "__MACOSX") || strings.HasSuffix(zipfile.Name, ".DS_Store") {
			continue
		}
		ext := strings.ToLower(filepath.Ext(zipfile.Name))
		if ext != ".html" && ext != ".hml" && ext != ".css" && ext != ".htmlx" {
			resourceFiles = append(resourceFiles, zipfile)
		}
	}
	type Mapping struct {
		oldPath string
		newPath string
	}
	// Concurrently process resource files
	pathMap := parallel.Map(resourceFiles, func(zipfile *zip.File, _ int) *Mapping {
		fileReader, err := zipfile.Open()
		if err != nil {
			c.logger.Error("failed to open zip file: ", log.Error(err))
			return nil
		}
		defer fileReader.Close()

		key, err := c.file.UploadFileFromReader(ctx, kbid, zipfile.Name, fileReader, int64(zipfile.UncompressedSize64))
		if err != nil {
			c.logger.Error("failed to upload file to oss: ", log.Error(err))
			return nil
		}

		return &Mapping{
			oldPath: zipfile.Name,
			newPath: fmt.Sprintf("/%s/%s", domain.Bucket, key),
		}
	})

	defeatResult := lo.Filter(pathMap, func(mapping *Mapping, _ int) bool {
		return mapping == nil
	})
	if len(defeatResult) > 0 {
		return nil, fmt.Errorf("some files failed to be uploaded")
	}

	// Convert parallel.Map results to pathMap
	pm := make(map[string]string)
	for _, result := range pathMap {
		//	去掉result.oldPath第一级路径。a/b/c -> b/c
		c.logger.Debug("uploaded file to OSS", log.String("file_name", utils.RemoveFirstDir(result.oldPath)), log.String("oss_key", result.newPath))

		pm[utils.RemoveFirstDir(result.oldPath)] = result.newPath
	}

	// Second pass: process HTML files concurrently
	htmlFiles := make([]*zip.File, 0)
	for _, zipfile := range zipReader.File {
		if strings.HasPrefix(zipfile.Name, "__MACOSX") || strings.HasSuffix(zipfile.Name, ".DS_Store") {
			continue
		}
		ext := strings.ToLower(filepath.Ext(zipfile.Name))
		if ext == ".html" || ext == ".htm" || ext == ".htmlx" {
			htmlFiles = append(htmlFiles, zipfile)
		}
	}
	// Concurrently process HTML files
	results := parallel.Map(htmlFiles, func(zipfile *zip.File, _ int) *domain.AnalysisConfluenceResp {
		fileReader, err := zipfile.Open()
		if err != nil {
			c.logger.Error("failed to open zip file:", log.Error(err))
			return nil
		}
		defer fileReader.Close()

		fileData, err := io.ReadAll(fileReader)
		if err != nil {
			c.logger.Error("failed to read file: ", log.Error(err))
			return nil
		}

		conv := converter.NewConverter(
			converter.WithPlugins(
				base.NewBasePlugin(),
				commonmark.NewCommonmarkPlugin(
					commonmark.WithStrongDelimiter("__"),
				),
			),
		)
		conv.Register.TagType("a", converter.TagTypeRemove, converter.PriorityStandard)
		mdStr, _ := conv.ConvertString(string(fileData))
		re := regexp.MustCompile(`!\[\s*(.*?)\s*]\s*\(\s*(.*?)\s*\)`)
		// 替换匹配到的内容，保留捕获的 URL
		newContent := re.ReplaceAllStringFunc(mdStr, func(match string) string {
			// 提取捕获的 URL
			title := re.ReplaceAllString(match, `$1`)
			url := re.ReplaceAllString(match, `$2`)
			if isBase64Url(&url) {
				url, err = c.transferBase64Url(ctx, title, kbid, &url)
				if err != nil {
					c.logger.Error("failed to transfer base64 url: ", log.Error(err))
					return ""
				}
			}
			// 去掉url后面的参数
			url = strings.SplitN(url, "?", 2)[0]
			if _, ok := pm[url]; ok {
				return fmt.Sprintf(`![%s](%s)`, title, pm[url])
			}
			return fmt.Sprintf(`![%s](%s)`, title, url)
		})
		return &domain.AnalysisConfluenceResp{
			ID:      uuid.NewString(),
			Title:   utils.GetTitleFromMarkdown(newContent),
			Content: newContent,
		}
	})
	defeatResult2 := lo.Filter(results, func(result *domain.AnalysisConfluenceResp, _ int) bool {
		return result == nil
	})
	if len(defeatResult2) > 0 {
		return nil, fmt.Errorf("some html files failed to be processed")
	}

	// Collect final results
	var finalResults []domain.AnalysisConfluenceResp
	for _, result := range results {
		finalResults = append(finalResults, domain.AnalysisConfluenceResp{
			ID:      result.ID,
			Title:   result.Title,
			Content: result.Content,
		})
	}

	return finalResults, nil
}

var base64Regex = regexp.MustCompile(`data:(image/[^;]+);base64,([^)\s]+)`)

func isBase64Url(url *string) bool {
	return base64Regex.MatchString(*url)
}

func (c *ConfluenceUsecase) transferBase64Url(ctx context.Context, fileName, kbID string, url *string) (string, error) {
	// 使用base64Regex捕获URL中的图片数据
	matches := base64Regex.FindStringSubmatch(*url)
	if len(matches) != 3 {
		return "", fmt.Errorf("invalid base64 URL format")
	}
	imageType := matches[1]
	imageData := matches[2]
	// 将base64编码的数据转换为字节切片
	decoder := base64.NewDecoder(base64.StdEncoding, strings.NewReader(imageData))
	decodedLen := (len(imageData) * 3) / 4
	if imageData[len(imageData)-2] == '=' {
		decodedLen -= 2
	} else if imageData[len(imageData)-1] == '=' {
		decodedLen -= 1
	}
	exts, err := mime.ExtensionsByType(imageType)
	if err != nil {
		return "", fmt.Errorf("failed to get MIME extensions: %w", err)
	}
	fileName = fmt.Sprintf("%s-%s.%s", uuid.NewString(), fileName, exts[0]) // 使用UUID作为文件名
	key, err := c.file.UploadFileFromReader(ctx, kbID, fileName, decoder, int64(decodedLen))
	if err != nil {
		return "", fmt.Errorf("failed to upload image to S3: %w", err)
	}
	return fmt.Sprintf("/%s/%s", domain.Bucket, key), nil
}
