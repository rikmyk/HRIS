package payroll

import (
	"context"
	"testing"

	"hris/pkg/storage"
)

func TestCalculateStandardPayslip(t *testing.T) {
	storageMock := storage.NewMockMinIOStorage("localhost:9000", "hris-payslips", false)
	svc := NewService(storageMock)
	ctx := context.Background()

	input := CalculationInput{
		EmployeeID:       "emp-001",
		PeriodID:         "period-2026-08",
		BaseSalary:       9000000,
		TransportAllow:   1000000,
		MealAllow:        500000,
		TotalPresent:     20,
		TotalLateMinutes: 0,
		UnpaidLeaveDays:  0,
	}

	result, err := svc.CalculatePayslip(ctx, input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	expectedGross := 10500000.0
	expectedNet := 10500000.0

	if result.GrossSalary != expectedGross {
		t.Errorf("expected gross %f, got: %f", expectedGross, result.GrossSalary)
	}

	if result.NetSalary != expectedNet {
		t.Errorf("expected net %f, got: %f", expectedNet, result.NetSalary)
	}

	if result.TotalDeduction != 0 {
		t.Errorf("expected 0 deduction, got: %f", result.TotalDeduction)
	}
}

func TestCalculatePayslipWithLateDeductions(t *testing.T) {
	storageMock := storage.NewMockMinIOStorage("localhost:9000", "hris-payslips", false)
	svc := NewService(storageMock)
	ctx := context.Background()

	input := CalculationInput{
		EmployeeID:       "emp-001",
		PeriodID:         "period-2026-08",
		BaseSalary:       9000000,
		TransportAllow:   1000000,
		MealAllow:        0,
		TotalPresent:     18,
		TotalLateMinutes: 30, // 30 mins late * 5000 Rp = 150.000 Rp deduction
		UnpaidLeaveDays:  0,
		LateRatePerMin:   5000,
	}

	result, err := svc.CalculatePayslip(ctx, input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	expectedGross := 10000000.0
	expectedDeduction := 150000.0
	expectedNet := 9850000.0

	if result.GrossSalary != expectedGross {
		t.Errorf("expected gross %f, got: %f", expectedGross, result.GrossSalary)
	}

	if result.TotalDeduction != expectedDeduction {
		t.Errorf("expected deduction %f, got: %f", expectedDeduction, result.TotalDeduction)
	}

	if result.NetSalary != expectedNet {
		t.Errorf("expected net %f, got: %f", expectedNet, result.NetSalary)
	}
}

func TestCalculatePayslipWithUnpaidLeave(t *testing.T) {
	storageMock := storage.NewMockMinIOStorage("localhost:9000", "hris-payslips", false)
	svc := NewService(storageMock)
	ctx := context.Background()

	input := CalculationInput{
		EmployeeID:       "emp-002",
		PeriodID:         "period-2026-08",
		BaseSalary:       8800000,
		TransportAllow:   0,
		MealAllow:        0,
		TotalPresent:     17,
		TotalLateMinutes: 0,
		UnpaidLeaveDays:  2, // 2 days * (8.800.000 / 22) = 800.000 Rp deduction
	}

	result, err := svc.CalculatePayslip(ctx, input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	expectedDeduction := 800000.0
	expectedNet := 8000000.0

	if result.TotalDeduction != expectedDeduction {
		t.Errorf("expected deduction %f, got: %f", expectedDeduction, result.TotalDeduction)
	}

	if result.NetSalary != expectedNet {
		t.Errorf("expected net %f, got: %f", expectedNet, result.NetSalary)
	}
}
