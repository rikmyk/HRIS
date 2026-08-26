package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

type PayslipCache interface {
	GetPayslip(ctx context.Context, key string, target interface{}) (bool, error)
	SetPayslip(ctx context.Context, key string, data interface{}, ttl time.Duration) error
	InvalidatePayslip(ctx context.Context, key string) error
}

type MemoryPayslipCache struct {
	store map[string][]byte
}

func NewMemoryPayslipCache() *MemoryPayslipCache {
	return &MemoryPayslipCache{
		store: make(map[string][]byte),
	}
}

func (c *MemoryPayslipCache) GetPayslip(ctx context.Context, key string, target interface{}) (bool, error) {
	val, exists := c.store[key]
	if !exists {
		return false, nil
	}
	if err := json.Unmarshal(val, target); err != nil {
		return false, err
	}
	return true, nil
}

func (c *MemoryPayslipCache) SetPayslip(ctx context.Context, key string, data interface{}, ttl time.Duration) error {
	b, err := json.Marshal(data)
	if err != nil {
		return err
	}
	c.store[key] = b
	return nil
}

func (c *MemoryPayslipCache) InvalidatePayslip(ctx context.Context, key string) error {
	delete(c.store, key)
	return nil
}

func FormatPayslipCacheKey(employeeID, periodID string) string {
	return fmt.Sprintf("cache:payslip:%s:%s", periodID, employeeID)
}
