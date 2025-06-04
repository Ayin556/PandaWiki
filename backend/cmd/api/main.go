package main

import (
	"fmt"

	"github.com/chaitin/panda-wiki/telemetry"
)

func main() {
	app, err := createApp()
	if err != nil {
		panic(err)
	}
	client := telemetry.NewClient(app.Logger)
	defer client.Stop()
	port := app.Config.HTTP.Port
	app.Logger.Info(fmt.Sprintf("Starting server on port %d", port))
	app.HTTPServer.Echo.Logger.Fatal(app.HTTPServer.Echo.Start(fmt.Sprintf(":%d", port)))
}
