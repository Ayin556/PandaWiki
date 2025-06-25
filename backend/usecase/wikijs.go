package usecase

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"mime/multipart"

	"github.com/chaitin/panda-wiki/domain"
)

type WikiJSUsecase struct{}

func NewWikiJSUsecase() *WikiJSUsecase {
	return &WikiJSUsecase{}
}

func (u *WikiJSUsecase) AnalysisExportFile(f multipart.File) (*[]domain.WikiJSPage, error) {
	gzReader, err := gzip.NewReader(f)
	if err != nil {
		return nil, err
	}
	defer gzReader.Close()

	data, err := io.ReadAll(gzReader)
	if err != nil {
		return nil, err
	}

	var pages []domain.WikiJSPage
	if err := json.Unmarshal(data, &pages); err != nil {
		return nil, err
	}

	return &pages, nil
}
