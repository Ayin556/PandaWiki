package telemetry

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/chaitin/panda-wiki/log"
)

const (
	machineIDFile  = "/data/.machine_id"
	reportInterval = time.Hour
)

// Client is the telemetry client
type Client struct {
	baseURL     string
	httpClient  *http.Client
	machineID   string
	firstReport bool
	stopChan    chan struct{}
	logger      *log.Logger
}

// NewClient creates a new telemetry client
func NewClient(logger *log.Logger) *Client {
	baseURL := "https://baizhi.cloud/api/public/data/report"
	client := &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		firstReport: true,
		stopChan:    make(chan struct{}),
	}

	// get or create machine ID
	client.machineID = client.getOrCreateMachineID()

	// report immediately on startup
	if err := client.reportInstallation(); err != nil {
		logger.Error("initial report installation", log.Error(err))
	}

	// start periodic report
	go client.startPeriodicReport()

	return client
}

// getOrCreateMachineID 获取或创建机器ID
func (c *Client) getOrCreateMachineID() string {
	// try to read from file
	if id, err := os.ReadFile(machineIDFile); err == nil {
		c.firstReport = false
		return strings.TrimSpace(string(id))
	}

	// try to get hardware ID
	id := c.getHardwareID()
	if id == "" {
		// if get hardware ID failed, generate random ID
		id = uuid.New().String()
	}

	// ensure directory exists
	dir := filepath.Dir(machineIDFile)
	if err := os.MkdirAll(dir, 0o755); err == nil {
		// write to file
		os.WriteFile(machineIDFile, []byte(id), 0o644)
	}

	return id
}

// getHardwareID generates a unique ID based on hardware information
func (c *Client) getHardwareID() string {
	var info []string

	// get CPU information
	if cpuInfo, err := os.ReadFile("/proc/cpuinfo"); err == nil {
		// extract CPU model
		lines := strings.Split(string(cpuInfo), "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "model name") {
				parts := strings.Split(line, ":")
				if len(parts) > 1 {
					info = append(info, strings.TrimSpace(parts[1]))
					break
				}
			}
		}
	}

	// get motherboard serial number
	if serial, err := os.ReadFile("/sys/class/dmi/id/board_serial"); err == nil {
		info = append(info, strings.TrimSpace(string(serial)))
	}

	// get MAC address
	if mac, err := os.ReadFile("/sys/class/net/eth0/address"); err == nil {
		info = append(info, strings.TrimSpace(string(mac)))
	}

	if len(info) == 0 {
		return ""
	}

	// use hardware info to generate ID
	hash := sha256.Sum256([]byte(strings.Join(info, "|")))
	return hex.EncodeToString(hash[:])
}

// startPeriodicReport starts periodic report
func (c *Client) startPeriodicReport() {
	ticker := time.NewTicker(reportInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := c.reportInstallation(); err != nil {
				c.logger.Error("periodic report installation", log.Error(err))
			}
		case <-c.stopChan:
			return
		}
	}
}

// reportInstallation reports installation information
func (c *Client) reportInstallation() error {
	event := InstallationEvent{
		Version:   Version,
		Timestamp: time.Now().Format(time.RFC3339),
		MachineID: c.machineID,
		Type:      "installation",
	}
	if !c.firstReport {
		event.Type = "heartbeat"
	}

	eventRaw, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal installation event: %w", err)
	}
	eventEncrypted, err := Encrypt([]byte("bd2599605d301656c8f6"), eventRaw)
	if err != nil {
		return fmt.Errorf("encrypt installation event: %w", err)
	}
	data := map[string]string{
		"index": "panda-wiki-installation",
		"data":  eventEncrypted,
		"id":    uuid.New().String(),
	}
	eventEncryptedRaw, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("marshal installation event: %w", err)
	}
	req, err := http.NewRequest("POST", c.baseURL, bytes.NewBuffer(eventEncryptedRaw))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
	c.firstReport = false

	return nil
}

// Stop stops periodic report
func (c *Client) Stop() {
	close(c.stopChan)
}

// InstallationEvent represents installation event
type InstallationEvent struct {
	Version   string `json:"version"`
	MachineID string `json:"machine_id"`
	Timestamp string `json:"timestamp"`
	Type      string `json:"type"`
}
