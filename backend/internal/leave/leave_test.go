package leave

import (
	"context"
	"testing"
)

func TestCreateLeaveRequest(t *testing.T) {
	svc := NewService()
	ctx := context.Background()

	input := CreateLeaveRequestInput{
		EmployeeID:  "emp-001",
		LeaveTypeID: "lt-01",
		StartDate:   "2026-08-26",
		EndDate:     "2026-08-28",
		Reason:      "Cuti tahunan keperluan keluarga",
	}

	req, err := svc.CreateLeaveRequest(ctx, input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if req.DaysCount != 3 {
		t.Errorf("expected 3 days count, got: %d", req.DaysCount)
	}

	if req.Status != "pending" {
		t.Errorf("expected status pending, got: %s", req.Status)
	}
}

func TestApproveLeaveRequest(t *testing.T) {
	svc := NewService()
	ctx := context.Background()

	input := CreateLeaveRequestInput{
		EmployeeID:  "emp-001",
		LeaveTypeID: "lt-01",
		StartDate:   "2026-08-26",
		EndDate:     "2026-08-28",
		Reason:      "Cuti tahunan",
	}

	req, _ := svc.CreateLeaveRequest(ctx, input)

	approved, err := svc.ApproveOrRejectLeaveRequest(ctx, req.ID, "mgr-001", "approve")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if approved.Status != "approved" {
		t.Errorf("expected status approved, got: %s", approved.Status)
	}

	if approved.ApprovedBy != "mgr-001" {
		t.Errorf("expected approved_by mgr-001, got: %s", approved.ApprovedBy)
	}
}

func TestInvalidDateRangeLeaveRequest(t *testing.T) {
	svc := NewService()
	ctx := context.Background()

	input := CreateLeaveRequestInput{
		EmployeeID:  "emp-001",
		LeaveTypeID: "lt-01",
		StartDate:   "2026-08-28",
		EndDate:     "2026-08-26", // End date before start date
		Reason:      "Salah tanggal",
	}

	_, err := svc.CreateLeaveRequest(ctx, input)
	if err != ErrInvalidDateRange {
		t.Fatalf("expected ErrInvalidDateRange, got: %v", err)
	}
}
