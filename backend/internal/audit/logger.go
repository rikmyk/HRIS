package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

type AuditLog struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Entity     string    `json:"entity"`
	EntityID   string    `json:"entity_id"`
	Action     string    `json:"action"` // approve, mark_paid, reject, create
	BeforeData string    `json:"before_data,omitempty"`
	AfterData  string    `json:"after_data,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type Logger struct {
	logs []*AuditLog
}

func NewLogger() *Logger {
	return &Logger{
		logs: make([]*AuditLog, 0),
	}
}

func (l *Logger) LogAction(ctx context.Context, userID, entity, entityID, action string, before, after interface{}) (*AuditLog, error) {
	beforeJSON, _ := json.Marshal(before)
	afterJSON, _ := json.Marshal(after)

	entry := &AuditLog{
		ID:         fmt.Sprintf("audit-%d", time.Now().UnixNano()),
		UserID:     userID,
		Entity:     entity,
		EntityID:   entityID,
		Action:     action,
		BeforeData: string(beforeJSON),
		AfterData:  string(afterJSON),
		CreatedAt:  time.Now(),
	}

	l.logs = append(l.logs, entry)
	return entry, nil
}

func (l *Logger) GetLogsByEntity(ctx context.Context, entity, entityID string) []*AuditLog {
	var res []*AuditLog
	for _, entry := range l.logs {
		if entry.Entity == entity && entry.EntityID == entityID {
			res = append(res, entry)
		}
	}
	return res
}
