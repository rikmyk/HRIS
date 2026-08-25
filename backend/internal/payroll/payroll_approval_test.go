package payroll

import (
	"context"
	"testing"

	"hris/pkg/storage"
)

func TestFullPayrollApprovalAndPaymentLifecycle(t *testing.T) {
	storageMock := storage.NewMockMinIOStorage("localhost:9000", "hris-payslips", false)
	svc := NewService(storageMock)
	ctx := context.Background()

	// Step 1: Verify initial draft payslip
	ps, err := svc.GetPayslipForEmployee(ctx, "emp-001", "period-2026-08")
	if err != nil {
		t.Fatalf("expected payslip ps-001, got error: %v", err)
	}
	if ps.Status != "draft" {
		t.Fatalf("expected initial status 'draft', got: %s", ps.Status)
	}
	if ps.IsPaid {
		t.Fatalf("expected initial is_paid to be false")
	}

	// Step 2: Attempt marking as paid while still in 'draft' -> MUST FAIL
	_, err = svc.MarkAsPaid(ctx, ps.ID, "hr-admin-01", "TRF-TEST-001")
	if err != ErrNotApprovedYet {
		t.Fatalf("expected ErrNotApprovedYet when marking draft as paid, got: %v", err)
	}

	// Step 3: Approve Payslip (Draft -> Approved) & Generate PDF
	approved, err := svc.ApprovePayslip(ctx, ps.ID, "hr-admin-01")
	if err != nil {
		t.Fatalf("failed to approve payslip: %v", err)
	}
	if approved.Status != "approved" {
		t.Fatalf("expected status 'approved', got: %s", approved.Status)
	}
	if approved.ApprovedBy != "hr-admin-01" {
		t.Fatalf("expected approved_by 'hr-admin-01', got: %s", approved.ApprovedBy)
	}
	if approved.PDFURL == "" {
		t.Fatalf("expected generated PDF URL upon approval, got empty string")
	}

	// Step 4: Mark Approved Payslip as Paid (Approved -> Paid)
	paid, err := svc.MarkAsPaid(ctx, ps.ID, "hr-admin-01", "TRF-BANK-88001")
	if err != nil {
		t.Fatalf("failed to mark payslip as paid: %v", err)
	}
	if !paid.IsPaid {
		t.Fatalf("expected is_paid to be true")
	}
	if paid.PaymentReference != "TRF-BANK-88001" {
		t.Fatalf("expected reference 'TRF-BANK-88001', got: %s", paid.PaymentReference)
	}

	// Step 5: Attempt marking ALREADY PAID payslip again -> MUST FAIL
	_, err = svc.MarkAsPaid(ctx, ps.ID, "hr-admin-01", "TRF-BANK-88001")
	if err != ErrAlreadyPaid {
		t.Fatalf("expected ErrAlreadyPaid when marking paid payslip again, got: %v", err)
	}
}
