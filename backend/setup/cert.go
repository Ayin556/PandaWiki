package setup

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"math/big"
	"os"
	"os/user"
	"path/filepath"
	"runtime"
	"time"
)

// getCertPath returns the certificate file path based on the OS
func getCertPath(filename string) string {
	switch runtime.GOOS {
	case "windows":
		return filepath.Join(os.Getenv("APPDATA"), "panda-wiki", "ssl", filename)
	default:
		// For Unix-like systems, check if we can write to /app, otherwise use temp directory
		tempDir := "/app/etc/nginx/ssl"
		if err := os.MkdirAll(tempDir, 0755); err != nil {
			// If we can't write to /app, use temp directory
			user, _ := user.Current()
			if user != nil {
				tempDir = filepath.Join(user.HomeDir, ".panda-wiki", "ssl")
			} else {
				tempDir = filepath.Join(os.TempDir(), "panda-wiki-ssl")
			}
		}
		return filepath.Join(tempDir, filename)
	}
}

var (
	keyFile  = getCertPath("panda-wiki.key")
	certFile = getCertPath("panda-wiki.crt")
)

// check init cert
func CheckInitCert() error {
	// Check both key and cert files
	keyExists := false
	certExists := false

	if _, err := os.Stat(keyFile); err == nil {
		keyExists = true
	}

	if _, err := os.Stat(certFile); err == nil {
		certExists = true
	}

	// If either file is missing, recreate both
	if !keyExists || !certExists {
		return createSelfSignedCerts()
	}

	return nil
}

func createSelfSignedCerts() error {
	// Generate RSA private key
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return fmt.Errorf("failed to generate private key: %v", err)
	}

	// Create certificate template
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			CommonName: "pandawiki.docs.baizhi.cloud",
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().AddDate(10, 0, 0), // Certificate valid for 10 year
		IsCA:                  true,
		BasicConstraintsValid: true,
		KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		DNSNames:              []string{"pandawiki.docs.baizhi.cloud"},
	}

	// Sign certificate with private key
	certBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, privateKey.Public(), privateKey)
	if err != nil {
		return fmt.Errorf("failed to create certificate: %v", err)
	}

	// Extract the directory path from the certFile
	dirPath := filepath.Dir(certFile)
	// ensure dir exists
	if err := os.MkdirAll(dirPath, 0o755); err != nil {
		return fmt.Errorf("failed to create ssl dir: %v", err)
	}

	// Write certificate file with appropriate permissions
	certOut, err := os.Create(certFile)
	if err != nil {
		return fmt.Errorf("failed to create cert file: %v", err)
	}
	defer certOut.Close()

	// Set certificate file permissions to 644 (readable by all)
	if err := os.Chmod(certFile, 0o644); err != nil {
		return fmt.Errorf("failed to set cert file permissions: %v", err)
	}

	err = pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: certBytes})
	if err != nil {
		return fmt.Errorf("failed to encode certificate: %v", err)
	}

	// Write private key file with appropriate permissions
	keyOut, err := os.Create(keyFile)
	if err != nil {
		return fmt.Errorf("failed to create key file: %v", err)
	}
	defer keyOut.Close()

	// Set private key file permissions to 600 (owner read/write)
	if err := os.Chmod(keyFile, 0o600); err != nil {
		return fmt.Errorf("failed to set key file permissions: %v", err)
	}

	err = pem.Encode(keyOut, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(privateKey)})
	if err != nil {
		return fmt.Errorf("failed to encode private key: %v", err)
	}

	return nil
}
