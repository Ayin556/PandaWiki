package pg

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/chaitin/panda-wiki/config"
	"github.com/chaitin/panda-wiki/domain"
	"github.com/chaitin/panda-wiki/log"
	"github.com/chaitin/panda-wiki/store/pg"
	"github.com/chaitin/panda-wiki/store/rag"
)

type KnowledgeBaseRepository struct {
	db     *pg.DB
	config *config.Config
	logger *log.Logger
	rag    rag.RAGService
}

func NewKnowledgeBaseRepository(db *pg.DB, config *config.Config, logger *log.Logger, rag rag.RAGService) *KnowledgeBaseRepository {
	r := &KnowledgeBaseRepository{
		db:     db,
		config: config,
		logger: logger.WithModule("repo.pg.knowledge_base"),
		rag:    rag,
	}
	ctx := context.Background()
	kbList, err := r.GetKnowledgeBaseList(ctx)
	if err != nil {
		r.logger.Error("failed to get knowledge base list", "error", err)
		return r
	}
	if len(kbList) > 0 {
		if err := r.SyncKBAccessSettingsToCaddy(ctx, kbList); err != nil {
			r.logger.Error("failed to sync kb access settings to caddy", "error", err)
		}
	}
	return r
}

func (r *KnowledgeBaseRepository) SyncKBAccessSettingsToCaddy(ctx context.Context, kbList []*domain.KnowledgeBaseListItem) error {
	pems := make([]map[string]any, 0)
	portHostKBMap := make(map[string]map[string]*domain.KnowledgeBaseListItem)
	ports := make(map[string]struct{})
	for _, kb := range kbList {
		for _, port := range kb.AccessSettings.Ports {
			ports[fmt.Sprintf(":%d", port)] = struct{}{}
			if _, ok := portHostKBMap[fmt.Sprintf(":%d", port)]; !ok {
				portHostKBMap[fmt.Sprintf(":%d", port)] = make(map[string]*domain.KnowledgeBaseListItem)
			}
			for _, host := range kb.AccessSettings.Hosts {
				portHostKBMap[fmt.Sprintf(":%d", port)][host] = kb
			}
		}
		for _, sslPort := range kb.AccessSettings.SSLPorts {
			if _, ok := portHostKBMap[fmt.Sprintf(":%d", sslPort)]; !ok {
				portHostKBMap[fmt.Sprintf(":%d", sslPort)] = make(map[string]*domain.KnowledgeBaseListItem)
			}
			for _, host := range kb.AccessSettings.Hosts {
				portHostKBMap[fmt.Sprintf(":%d", sslPort)][host] = kb
			}
		}
		if len(kb.AccessSettings.PublicKey) > 0 && len(kb.AccessSettings.PrivateKey) > 0 {
			pems = append(pems, map[string]any{
				"certificate": kb.AccessSettings.PublicKey,
				"key":         kb.AccessSettings.PrivateKey,
				"tags":        []string{kb.ID},
			})
		}
	}
	socketPath := r.config.CaddyAPI
	// sync kb to caddy
	// create server for each port
	subnetPrefix := r.config.SubnetPrefix
	if subnetPrefix == "" {
		subnetPrefix = "169.254.15"
	}
	api := fmt.Sprintf("%s.2:8000", subnetPrefix)
	app := fmt.Sprintf("%s.112:3010", subnetPrefix)
	staticFile := fmt.Sprintf("%s.12:9000", subnetPrefix) // minio
	servers := make(map[string]any, 0)
	for port, hostKBMap := range portHostKBMap {
		server := map[string]any{
			"listen": []string{port},
			"routes": []map[string]any{},
			"trusted_proxies": map[string]any{
				"source": "static",
				"ranges": []string{
					"192.168.0.0/16",
				},
			},
		}
		if _, ok := ports[port]; ok {
			server["automatic_https"] = map[string]any{
				"disable": true,
			}
		} else {
			server["automatic_https"] = map[string]any{
				"disable_certificates": true,
				"disable_redirects":    true,
			}
		}
		routes := make([]map[string]any, 0)
		for host, kb := range hostKBMap {
			route := map[string]any{
				"handle": []map[string]any{
					{
						"handler": "subroute",
						"routes": []map[string]any{
							{
								"match": []map[string]any{
									{
										"path": []string{"/share/v1/chat/message"},
									},
								},
								"handle": []map[string]any{
									{
										"handler": "headers",
										"request": map[string]any{
											"set": map[string][]any{
												"X-KB-ID": {kb.ID},
											},
										},
									},
									{
										"handler": "reverse_proxy",
										"upstreams": []map[string]any{
											{"dial": api},
										},
										"flush_interval": -1,
										"transport": map[string]any{
											"protocol":      "http",
											"read_timeout":  "10m",
											"write_timeout": "10m",
										},
									},
								},
							},
							{
								"match": []map[string]any{
									{
										"path": []string{"/share/v1/node/detail"},
									},
								},
								"handle": []map[string]any{
									{
										"handler": "headers",
										"request": map[string]any{
											"set": map[string][]any{
												"X-KB-ID": {kb.ID},
											},
										},
									},
									{
										"handler": "reverse_proxy",
										"upstreams": []map[string]any{
											{"dial": api},
										},
									},
								},
							},
							{
								"match": []map[string]any{
									{
										"path": []string{"/static-file/*"},
									},
								},
								"handle": []map[string]any{
									{
										"handler": "reverse_proxy",
										"upstreams": []map[string]any{
											{"dial": staticFile},
										},
										"flush_interval": -1,
										"transport": map[string]any{
											"protocol":      "http",
											"read_timeout":  "10m",
											"write_timeout": "10m",
										},
									},
								},
							},
							{
								"handle": []map[string]any{
									{
										"handler": "headers",
										"request": map[string]any{
											"set": map[string][]any{
												"X-KB-ID": {kb.ID},
											},
										},
									},
									{
										"handler": "reverse_proxy",
										"upstreams": []map[string]any{
											{"dial": app},
										},
									},
								},
							},
						},
					},
				},
			}
			if host != "*" {
				route["match"] = []map[string]any{
					{
						"host": []string{host},
					},
				}
			}
			routes = append(routes, route)
		}
		server["routes"] = routes
		servers[port] = server
	}
	apps := map[string]any{
		"http": map[string]any{
			"servers": servers,
		},
	}
	if len(pems) > 0 {
		apps["tls"] = map[string]any{
			"certificates": map[string]any{
				"load_pem": pems,
			},
		}
	}
	config := map[string]any{
		"apps": apps,
	}
	newBody, _ := json.Marshal(config)
	tr := &http.Transport{
		DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
			return net.Dial("unix", socketPath)
		},
	}
	client := &http.Client{
		Transport: tr,
		Timeout:   5 * time.Second,
	}
	req, err := http.NewRequest("POST", "http://unix/config/", bytes.NewBuffer(newBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		r.logger.Error("failed to update caddy config", "error", string(body))
		return domain.ErrSyncCaddyConfigFailed
	}
	return nil
}

func (r *KnowledgeBaseRepository) CreateKnowledgeBase(ctx context.Context, kb *domain.KnowledgeBase) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(kb).Error; err != nil {
			return err
		}
		// get all kb list
		var kbs []*domain.KnowledgeBaseListItem
		if err := tx.Model(&domain.KnowledgeBase{}).Find(&kbs).Error; err != nil {
			return err
		}
		if len(kbs) >= 10 {
			return fmt.Errorf("kb count is too many, max is 10")
		}

		if err := r.checkUniquePortHost(kbs); err != nil {
			return err
		}
		if err := r.SyncKBAccessSettingsToCaddy(ctx, kbs); err != nil {
			r.logger.Error("failed to sync kb access settings to caddy", "error", err)
			return err
		}
		if err := tx.Create(&domain.App{
			ID:   uuid.New().String(),
			KBID: kb.ID,
			Name: kb.Name,
			Type: domain.AppTypeWeb,
			Settings: domain.AppSettings{
				Title:      kb.Name,
				Desc:       kb.Name,
				Keyword:    kb.Name,
				WelcomeStr: fmt.Sprintf("欢迎使用%s", kb.Name),
			},
		}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *KnowledgeBaseRepository) checkUniquePortHost(kbList []*domain.KnowledgeBaseListItem) error {
	uniqPortHost := make(map[string]bool)
	for _, kb := range kbList {
		for _, port := range kb.AccessSettings.Ports {
			for _, host := range kb.AccessSettings.Hosts {
				portHostStr := fmt.Sprintf("%d%s", port, host)
				if _, ok := uniqPortHost[portHostStr]; !ok {
					uniqPortHost[portHostStr] = true
				} else {
					r.logger.Error("port and host already exists", "port", port, "host", host)
					return domain.ErrPortHostAlreadyExists
				}
			}
		}
		for _, sslPort := range kb.AccessSettings.SSLPorts {
			for _, host := range kb.AccessSettings.Hosts {
				portHostStr := fmt.Sprintf("%d%s", sslPort, host)
				if _, ok := uniqPortHost[portHostStr]; !ok {
					uniqPortHost[portHostStr] = true
				} else {
					r.logger.Error("port and host already exists", "port", sslPort, "host", host)
					return domain.ErrPortHostAlreadyExists
				}
			}
		}
	}
	return nil
}

func (r *KnowledgeBaseRepository) GetKnowledgeBaseList(ctx context.Context) ([]*domain.KnowledgeBaseListItem, error) {
	var kbs []*domain.KnowledgeBaseListItem
	if err := r.db.WithContext(ctx).Model(&domain.KnowledgeBase{}).Find(&kbs).Error; err != nil {
		return nil, err
	}
	return kbs, nil
}

func (r *KnowledgeBaseRepository) UpdateKnowledgeBase(ctx context.Context, req *domain.UpdateKnowledgeBaseReq) error {
	updateMap := map[string]any{}
	if req.Name != nil {
		updateMap["name"] = req.Name
	}
	if req.AccessSettings != nil {
		updateMap["access_settings"] = req.AccessSettings
	}
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&domain.KnowledgeBase{}).Where("id = ?", req.ID).Updates(updateMap).Error; err != nil {
			return err
		}
		// get all kb list
		var kbs []*domain.KnowledgeBaseListItem
		if err := tx.Model(&domain.KnowledgeBase{}).Find(&kbs).Error; err != nil {
			return err
		}
		if err := r.checkUniquePortHost(kbs); err != nil {
			return err
		}
		if err := r.SyncKBAccessSettingsToCaddy(ctx, kbs); err != nil {
			return fmt.Errorf("failed to sync kb access settings to caddy: %w", err)
		}
		return nil
	})
}

func (r *KnowledgeBaseRepository) GetKnowledgeBaseByID(ctx context.Context, kbID string) (*domain.KnowledgeBase, error) {
	var kb domain.KnowledgeBase
	if err := r.db.WithContext(ctx).Where("id = ?", kbID).First(&kb).Error; err != nil {
		return nil, err
	}
	return &kb, nil
}

func (r *KnowledgeBaseRepository) DeleteKnowledgeBase(ctx context.Context, kbID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("kb_id = ?", kbID).Delete(&domain.Node{}).Error; err != nil {
			return err
		}
		if err := tx.Where("kb_id = ?", kbID).Delete(&domain.App{}).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", kbID).Delete(&domain.KnowledgeBase{}).Error; err != nil {
			return err
		}
		// get all kb list
		var kbs []*domain.KnowledgeBaseListItem
		if err := tx.Model(&domain.KnowledgeBase{}).Find(&kbs).Error; err != nil {
			return err
		}
		if err := r.SyncKBAccessSettingsToCaddy(ctx, kbs); err != nil {
			return fmt.Errorf("failed to sync kb access settings to caddy: %w", err)
		}
		return nil
	})
}
