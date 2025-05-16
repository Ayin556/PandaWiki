//go:build wireinject
// +build wireinject

package main

import (
	"github.com/google/wire"

	"github.com/chaitin/panda-wiki/config"
	v1 "github.com/chaitin/panda-wiki/handler/v1"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/server/http"
)

func createApp() (*App, error) {
	wire.Build(
		wire.Struct(new(App), "*"),
		wire.NewSet(
			config.ProviderSet,
			log.ProviderSet,

			http.ProviderSet,
			v1.ProviderSet,
		),
	)
	return &App{}, nil
}

type App struct {
	HTTPServer *http.HTTPServer
	Handlers   *v1.APIHandlers
	Config     *config.Config
	Logger     *log.Logger
}
