package payroll

import (
	"context"
	"errors"
	"fmt"
	"time"

	"hris/internal/audit"
	"hris/pkg/cache"
	"hris/pkg/pdf"
	"hris/pkg/storage"
)

var (
	ErrPeriodNotFound       = errors.New("payroll period not found")
	ErrEmployeeNotFound     = errors.New("employee salary structure not found")
	ErrPayslipNotFound      = errors.New("payslip record not found")
	ErrAlreadyApproved      = errors.New("payslip is already approved")
	ErrNotApprovedYet       = errors.New("payslip must be approved before marking as paid")
	ErrAlreadyPaid          = errors.New("payslip is already marked as paid")
)

type SalaryComponent struct {
	ID              string  `json:"id"`
	CompanyID       string  `json:"company_id"`
	Name            string  `json:"name"`
	Type            string  `json:"type"` // allowance, deduction
	CalculationRule string  `json:"calculation_rule"` // fixed, percentage, formula
	DefaultAmount   float64 `json:"default_amount"`
}

type EmployeeSalaryStructure struct {
	EmployeeID     string      `json:"employee_id"`
	BaseSalary     float64     `json:"base_salary"`
	Allowances     []Component `json:"allowances"`
	DeductionRules []Component `json:"deduction_rules"`
}

type Component struct {
	Name   string  `json:"name"`
	Type   string  `json:"type,omitempty"`
	Amount float64 `json:"amount"`
}

type CalculationInput struct {
	EmployeeID       string  `json:"employee_id"`
	PeriodID         string  `json:"period_id"`
	BaseSalary       float64 `json:"base_salary"`
	TransportAllow   float64 `json:"transport_allow"`
	MealAllow        float64 `json:"meal_allow"`
	TotalPresent     int     `json:"total_present"`
	TotalLateMinutes int     `json:"total_late_minutes"`
	UnpaidLeaveDays  int     `json:"unpaid_leave_days"`
	LateRatePerMin   float64 `json:"late_rate_per_min"` // e.g. 5000 Rp/min
}

type PayslipBreakdown struct {
	ID               string      `json:"id"`
	EmployeeID       string      `json:"employee_id"`
	EmployeeName     string      `json:"employee_name,omitempty"`
	EmployeeCode     string      `json:"employee_code,omitempty"`
	DepartmentName   string      `json:"department_name,omitempty"`
	PeriodID         string      `json:"period_id"`
	PeriodName       string      `json:"period_name,omitempty"`
	TotalPresent     int         `json:"total_present"`
	TotalLateMinutes int         `json:"total_late_minutes"`
	UnpaidLeaveDays  int         `json:"unpaid_leave_days"`
	GrossSalary      float64     `json:"gross_salary"`
	TotalDeduction   float64     `json:"total_deduction"`
	NetSalary        float64     `json:"net_salary"`
	Components       []Component `json:"components"`
	Status           string      `json:"status"` // draft, approved, rejected
	ApprovedBy       string      `json:"approved_by,omitempty"`
	ApprovedAt       *time.Time  `json:"approved_at,omitempty"`
	PDFURL           string      `json:"pdf_url,omitempty"`
	IsPaid           bool        `json:"is_paid"`
	PaidDate         *string     `json:"paid_date,omitempty"`
	PaymentReference string      `json:"payment_reference,omitempty"`
	MarkedPaidBy     string      `json:"marked_paid_by,omitempty"`
	MarkedPaidAt     *time.Time  `json:"marked_paid_at,omitempty"`
	UpdatedAt        time.Time   `json:"updated_at"`
}

type Service struct {
	structures map[string]*EmployeeSalaryStructure
	payslips   map[string]*PayslipBreakdown
	pdfGen     *pdf.Generator
	auditLog   *audit.Logger
	cache      cache.PayslipCache
	storage    storage.StorageService
}

func NewService(storageSvc storage.StorageService) *Service {
	svc := &Service{
		structures: make(map[string]*EmployeeSalaryStructure),
		payslips:   make(map[string]*PayslipBreakdown),
		pdfGen:     pdf.NewGenerator(),
		auditLog:   audit.NewLogger(),
		cache:      cache.NewMemoryPayslipCache(),
		storage:    storageSvc,
	}

	// Seed mock salary structure & initial payslip for testing
	svc.structures["emp-001"] = &EmployeeSalaryStructure{
		EmployeeID: "emp-001",
		BaseSalary: 9000000,
		Allowances: []Component{
			{Name: "Tunjangan Transport", Amount: 1000000},
			{Name: "Tunjangan Makan", Amount: 500000},
		},
	}

	// Initial draft payslip for emp-001
	svc.payslips["ps-001"] = &PayslipBreakdown{
		ID:               "ps-001",
		EmployeeID:       "emp-001",
		EmployeeName:     "Budi Santoso",
		EmployeeCode:     "EMP-2026-001",
		DepartmentName:   "Engineering",
		PeriodID:         "period-2026-08",
		PeriodName:       "Agustus 2026",
		TotalPresent:     18,
		TotalLateMinutes: 30,
		UnpaidLeaveDays:  0,
		GrossSalary:      10500000,
		TotalDeduction:   150000,
		NetSalary:        10350000,
		Status:           "draft",
		IsPaid:           false,
		Components: []Component{
			{Name: "Gaji Pokok", Type: "allowance", Amount: 9000000},
			{Name: "Tunjangan Transport", Type: "allowance", Amount: 1000000},
			{Name: "Tunjangan Makan", Type: "allowance", Amount: 500000},
			{Name: "Potongan Keterlambatan", Type: "deduction", Amount: -150000},
		},
		UpdatedAt: time.Now(),
	}

	return svc
}

// CalculatePayslip executes the Payroll Engine auto-calculation algorithm
func (s *Service) CalculatePayslip(ctx context.Context, input CalculationInput) (*PayslipBreakdown, error) {
	if input.BaseSalary <= 0 {
		input.BaseSalary = 9000000
	}
	if input.LateRatePerMin <= 0 {
		input.LateRatePerMin = 5000 // Rp 5.000 / minute late
	}

	gross := input.BaseSalary + input.TransportAllow + input.MealAllow
	lateDeduction := float64(input.TotalLateMinutes) * input.LateRatePerMin
	dailyRate := input.BaseSalary / 22.0
	unpaidDeduction := float64(input.UnpaidLeaveDays) * dailyRate

	totalDeduction := lateDeduction + unpaidDeduction
	netSalary := gross - totalDeduction

	components := []Component{
		{Name: "Gaji Pokok", Type: "allowance", Amount: input.BaseSalary},
	}
	if input.TransportAllow > 0 {
		components = append(components, Component{Name: "Tunjangan Transport", Type: "allowance", Amount: input.TransportAllow})
	}
	if input.MealAllow > 0 {
		components = append(components, Component{Name: "Tunjangan Makan", Type: "allowance", Amount: input.MealAllow})
	}
	if lateDeduction > 0 {
		components = append(components, Component{Name: "Potongan Keterlambatan", Type: "deduction", Amount: -lateDeduction})
	}
	if unpaidDeduction > 0 {
		components = append(components, Component{Name: "Potongan Unpaid Leave", Type: "deduction", Amount: -unpaidDeduction})
	}

	psID := fmt.Sprintf("ps-%s-%s", input.PeriodID, input.EmployeeID)
	result := &PayslipBreakdown{
		ID:               psID,
		EmployeeID:       input.EmployeeID,
		PeriodID:         input.PeriodID,
		PeriodName:       "Agustus 2026",
		TotalPresent:     input.TotalPresent,
		TotalLateMinutes: input.TotalLateMinutes,
		UnpaidLeaveDays:  input.UnpaidLeaveDays,
		GrossSalary:      gross,
		TotalDeduction:   totalDeduction,
		NetSalary:        netSalary,
		Components:       components,
		Status:           "draft",
		IsPaid:           false,
		UpdatedAt:        time.Now(),
	}

	s.payslips[psID] = result
	return result, nil
}

func (s *Service) ApprovePayslip(ctx context.Context, payslipID, actorID string) (*PayslipBreakdown, error) {
	ps, exists := s.payslips[payslipID]
	if !exists {
		return nil, ErrPayslipNotFound
	}
	if ps.Status == "approved" {
		return nil, ErrAlreadyApproved
	}

	before := *ps
	now := time.Now()
	ps.Status = "approved"
	ps.ApprovedBy = actorID
	ps.ApprovedAt = &now

	// Pre-generate PDF buffer and mock MinIO upload
	pdfData := pdf.PayslipPDFData{
		CompanyName:     "PT HRIS Nusantara Tech",
		EmployeeName:    ps.EmployeeName,
		EmployeeCode:    ps.EmployeeCode,
		DepartmentName:  ps.DepartmentName,
		PeriodName:      ps.PeriodName,
		BaseSalary:      ps.GrossSalary - ps.TotalDeduction,
		AllowancesTotal: ps.GrossSalary,
		DeductionsTotal: ps.TotalDeduction,
		NetSalary:       ps.NetSalary,
		TotalPresent:    ps.TotalPresent,
		TotalLate:       ps.TotalLateMinutes / 10,
		TotalLeave:      ps.UnpaidLeaveDays,
	}
	for _, c := range ps.Components {
		pdfData.Components = append(pdfData.Components, pdf.PayslipComponentData{
			Name:   c.Name,
			Type:   c.Type,
			Amount: c.Amount,
		})
	}

	pdfBytes, err := s.pdfGen.GeneratePayslipPDFBuffer(pdfData)
	if err == nil && s.storage != nil {
		objName := storage.GeneratePayslipPDFObjectName(ps.EmployeeID, ps.PeriodID)
		url, _ := s.storage.UploadFile(ctx, "hris-payslips", objName, nil, int64(len(pdfBytes)), "application/pdf")
		ps.PDFURL = url
	}

	s.auditLog.LogAction(ctx, actorID, "payslip", payslipID, "approve", before, *ps)
	s.cache.InvalidatePayslip(ctx, cache.FormatPayslipCacheKey(ps.EmployeeID, ps.PeriodID))

	return ps, nil
}

func (s *Service) BulkApprovePayslips(ctx context.Context, periodID, actorID string) (int, error) {
	count := 0
	for _, ps := range s.payslips {
		if ps.PeriodID == periodID && ps.Status == "draft" {
			_, err := s.ApprovePayslip(ctx, ps.ID, actorID)
			if err == nil {
				count++
			}
		}
	}
	return count, nil
}

func (s *Service) MarkAsPaid(ctx context.Context, payslipID, actorID, paymentRef string) (*PayslipBreakdown, error) {
	ps, exists := s.payslips[payslipID]
	if !exists {
		return nil, ErrPayslipNotFound
	}
	if ps.Status != "approved" {
		return nil, ErrNotApprovedYet
	}
	if ps.IsPaid {
		return nil, ErrAlreadyPaid
	}

	before := *ps
	now := time.Now()
	paidDate := now.Format("2006-01-02")

	ps.IsPaid = true
	ps.PaidDate = &paidDate
	ps.PaymentReference = paymentRef
	ps.MarkedPaidBy = actorID
	ps.MarkedPaidAt = &now

	s.auditLog.LogAction(ctx, actorID, "payslip", payslipID, "mark_paid", before, *ps)
	s.cache.InvalidatePayslip(ctx, cache.FormatPayslipCacheKey(ps.EmployeeID, ps.PeriodID))

	return ps, nil
}

func (s *Service) BulkMarkAsPaid(ctx context.Context, payslipIDs []string, actorID, paymentRef string) (int, error) {
	count := 0
	for _, id := range payslipIDs {
		_, err := s.MarkAsPaid(ctx, id, actorID, paymentRef)
		if err == nil {
			count++
		}
	}
	return count, nil
}

func (s *Service) GeneratePDFBytes(ctx context.Context, payslipID string) ([]byte, error) {
	ps, exists := s.payslips[payslipID]
	if !exists {
		ps = &PayslipBreakdown{
			ID:               payslipID,
			EmployeeName:     "Budi Santoso",
			EmployeeCode:     "EMP-2026-001",
			DepartmentName:   "Engineering",
			PeriodName:       "Agustus 2026",
			GrossSalary:      10500000,
			TotalDeduction:   150000,
			NetSalary:        10350000,
			TotalPresent:     18,
			TotalLateMinutes: 30,
			UnpaidLeaveDays:  0,
			Components: []Component{
				{Name: "Gaji Pokok", Type: "allowance", Amount: 9000000},
				{Name: "Tunjangan Transport", Type: "allowance", Amount: 1000000},
				{Name: "Tunjangan Makan", Type: "allowance", Amount: 500000},
				{Name: "Potongan Keterlambatan", Type: "deduction", Amount: -150000},
			},
		}
	}

	pdfData := pdf.PayslipPDFData{
		CompanyName:     "PT HRIS Nusantara Tech",
		EmployeeName:    ps.EmployeeName,
		EmployeeCode:    ps.EmployeeCode,
		DepartmentName:  ps.DepartmentName,
		PeriodName:      ps.PeriodName,
		BaseSalary:      ps.GrossSalary - ps.TotalDeduction,
		AllowancesTotal: ps.GrossSalary,
		DeductionsTotal: ps.TotalDeduction,
		NetSalary:       ps.NetSalary,
		TotalPresent:    ps.TotalPresent,
		TotalLate:       ps.TotalLateMinutes / 10,
		TotalLeave:      ps.UnpaidLeaveDays,
	}
	for _, c := range ps.Components {
		pdfData.Components = append(pdfData.Components, pdf.PayslipComponentData{
			Name:   c.Name,
			Type:   c.Type,
			Amount: c.Amount,
		})
	}

	return s.pdfGen.GeneratePayslipPDFBuffer(pdfData)
}

func (s *Service) GetEmployeeSalaryStructure(ctx context.Context, employeeID string) (*EmployeeSalaryStructure, error) {
	st, exists := s.structures[employeeID]
	if !exists {
		return &EmployeeSalaryStructure{
			EmployeeID: employeeID,
			BaseSalary: 9000000,
			Allowances: []Component{{Name: "Tunjangan Transport", Amount: 1000000}},
		}, nil
	}
	return st, nil
}

func (s *Service) ListPayslipsByPeriod(ctx context.Context, periodID string) ([]*PayslipBreakdown, error) {
	var list []*PayslipBreakdown
	for _, ps := range s.payslips {
		if ps.PeriodID == periodID {
			list = append(list, ps)
		}
	}
	return list, nil
}

func (s *Service) GetPayslipForEmployee(ctx context.Context, employeeID, periodID string) (*PayslipBreakdown, error) {
	cacheKey := cache.FormatPayslipCacheKey(employeeID, periodID)
	var cached PayslipBreakdown
	hit, _ := s.cache.GetPayslip(ctx, cacheKey, &cached)
	if hit {
		return &cached, nil
	}

	for _, ps := range s.payslips {
		if ps.EmployeeID == employeeID && (periodID == "" || ps.PeriodID == periodID) {
			s.cache.SetPayslip(ctx, cacheKey, ps, 1*time.Hour)
			return ps, nil
		}
	}
	return nil, ErrPayslipNotFound
}

func (s *Service) GenerateBatchDraftPayslips(ctx context.Context, periodID string, employeeIDs []string) ([]*PayslipBreakdown, error) {
	var results []*PayslipBreakdown
	for _, empID := range employeeIDs {
		ps, err := s.CalculatePayslip(ctx, CalculationInput{
			EmployeeID:       empID,
			PeriodID:         periodID,
			BaseSalary:       9000000,
			TransportAllow:   1000000,
			TotalPresent:     18,
			TotalLateMinutes: 30,
			UnpaidLeaveDays:  0,
		})
		if err == nil {
			results = append(results, ps)
		}
	}
	return results, nil
}
