package utils

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/88250/lute"
	"github.com/Wsine/feishu2md/core"
	fershu2mdUtil "github.com/Wsine/feishu2md/utils"
	"github.com/chaitin/panda-wiki/store/s3"
)

func DownloadDocument(ctx context.Context, appID, secret, url string, minioClient *s3.MinioClient, kbID string) (string, string, error) {
	client := core.NewClient(
		appID, secret,
	)
	// Validate the url to download
	var dlConfig core.Config
	dlConfig.Output = core.OutputConfig{
		ImageDir:        "./temp/images",
		SkipImgDownload: false,
		TitleAsFilename: false,
		UseHTMLTags:     true,
	}
	// 清理图像临时存储目录
	defer func() {
		os.RemoveAll(dlConfig.Output.ImageDir)
	}()
	docType, docToken, err := fershu2mdUtil.ValidateDocumentURL(url)
	if err != nil {
		return "", "", err
	}
	fmt.Println("Captured document token:", docToken)

	if docType == "wiki" {
		node, err := client.GetWikiNodeInfo(ctx, docToken)
		if err != nil {
			return "", "", fmt.Errorf("GetWikiNodeInfo err: %v for %v", err, url)
		}
		docToken = node.ObjToken
	}

	// Process the download
	docx, blocks, err := client.GetDocxContent(ctx, docToken)
	if err != nil {
		return "", "", err
	}

	parser := core.NewParser(dlConfig.Output)

	title := docx.Title
	markdown := parser.ParseDocxContent(docx, blocks)
	type imgReplace struct {
		token string
		path  string
	}

	replaceChan := make(chan imgReplace, len(parser.ImgTokens))
	errChan := make(chan error, len(parser.ImgTokens))
	var wg sync.WaitGroup
	for _, imgToken := range parser.ImgTokens {
		wg.Add(1)
		go func(token string) {
			defer wg.Done()

			localLink, err := client.DownloadImage(ctx, token, dlConfig.Output.ImageDir)
			if err != nil {
				errChan <- fmt.Errorf("下载图片失败: %v", err)
				return
			}

			osspath, err := UploadImage(ctx, minioClient, localLink, kbID)
			if err != nil {
				errChan <- fmt.Errorf("上传图片失败: %v", err)
				return
			}

			replaceChan <- imgReplace{token: token, path: osspath}
		}(imgToken)
	}
	go func() {
		wg.Wait()
		close(replaceChan)
		close(errChan)
	}()

	// 检查错误
	select {
	case err := <-errChan:
		return "", "", err
	default:
	}
	replaces := make(map[string]string)
	for r := range replaceChan {
		replaces[r.token] = r.path
	}
	replacePairs := make([]string, 0, len(replaces)*2)
	for token, path := range replaces {
		replacePairs = append(replacePairs, token, path)
	}

	// 创建一次性替换器
	replacer := strings.NewReplacer(replacePairs...)
	markdown = replacer.Replace(markdown)

	// Format the markdown document
	engine := lute.New(func(l *lute.Lute) {
		l.RenderOptions.AutoSpace = true
	})
	result := engine.FormatStr("md", markdown)
	return title, result, nil
}
