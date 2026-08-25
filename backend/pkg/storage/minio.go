package storage

import (
	"context"
	"fmt"
	"io"
	"time"
)

type StorageService interface {
	UploadFile(ctx context.Context, bucketName, objectName string, reader io.Reader, size int64, contentType string) (string, error)
}

type MockMinIOStorage struct {
	Endpoint  string
	Bucket    string
	UseSSL    bool
}

func NewMockMinIOStorage(endpoint, bucket string, useSSL bool) *MockMinIOStorage {
	return &MockMinIOStorage{
		Endpoint: endpoint,
		Bucket:   bucket,
		UseSSL:   useSSL,
	}
}

func (s *MockMinIOStorage) UploadFile(ctx context.Context, bucketName, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	scheme := "http"
	if s.UseSSL {
		scheme = "https"
	}
	url := fmt.Sprintf("%s://%s/%s/%s", scheme, s.Endpoint, bucketName, objectName)
	return url, nil
}

func GeneratePhotoObjectName(employeeID, action string) string {
	timestamp := time.Now().Format("20060102-150405")
	return fmt.Sprintf("attendance/%s/%s-%s.jpg", employeeID, action, timestamp)
}
