package pg

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/golang-migrate/migrate/v4"
	migratePG "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/chaitin/panda-wiki/config"
)

type DB struct {
	*gorm.DB
}

func NewDB(config *config.Config) (*DB, error) {
	dsn := config.PG.DSN
	// same as gorm logger.Default, but without colorful output and ignore record not found error
	newLogger := logger.New(log.New(os.Stdout, "\r\n", log.LstdFlags), logger.Config{
		SlowThreshold:             200 * time.Millisecond,
		LogLevel:                  logger.Warn,
		IgnoreRecordNotFoundError: true,
		Colorful:                  false,
	})
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		TranslateError: true,
		Logger:         newLogger,
	})
	if err != nil {
		return nil, err
	}
	// create raglite database if not exists
	var exists bool
	if err := db.Raw("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'raglite')").Scan(&exists).Error; err != nil {
		return nil, err
	}
	if !exists {
		if err := db.Exec("CREATE DATABASE raglite").Error; err != nil {
			return nil, err
		}
	}
	if err := doMigrate(dsn); err != nil {
		return nil, err
	}

	return &DB{DB: db}, nil
}

func doMigrate(dsn string) error {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("open db failed: %w", err)
	}
	driver, err := migratePG.WithInstance(db, &migratePG.Config{})
	if err != nil {
		return fmt.Errorf("with instance failed: %w", err)
	}

	// 定位 migration 目录：优先使用 MIGRATION_PATH 环境变量，否则基于源码路径定位
	migrationPath := os.Getenv("MIGRATION_PATH")
	if migrationPath == "" {
		// 基于当前源文件路径定位 migration 目录（编译后也能正确定位）
		_, filename, _, _ := runtime.Caller(0)
		dir := filepath.Dir(filename)
		absPath := filepath.Join(dir, "migration")
		migrationPath = "file://" + absPath
	} else {
		if !filepath.IsAbs(migrationPath) {
			absPath, _ := filepath.Abs(migrationPath)
			migrationPath = "file://" + absPath
		} else {
			migrationPath = "file://" + migrationPath
		}
	}

	m, err := migrate.NewWithDatabaseInstance(
		migrationPath,
		"postgres", driver)
	if err != nil {
		return fmt.Errorf("new with database instance failed: %w", err)
	}
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			return nil
		}
		return fmt.Errorf("migrate db failed: %w", err)
	}

	return nil
}
