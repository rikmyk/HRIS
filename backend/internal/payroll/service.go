package payroll

import (
	"context"
	"errors"
)

var (
	ErrPeriodNotFound     = errors.New("payroll period not found")
	ErrEmployeeNotFound   = errors.New("employee salary structure not found")
	ErrPayrollCalculation = errors.New("error calculating payroll breakdown")
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
	EmployeeID       string      `json:"employee_id"`
	PeriodID         string      `json:"period_id"`
	TotalPresent     int         `json:"total_present"`
	TotalLateMinutes int         `json:"total_late_minutes"`
	UnpaidLeaveDays  int         `json:"unpaid_leave_days"`
	GrossSalary      float64     `json:"gross_salary"`
	TotalDeduction   float64     `json:"total_deduction"`
	NetSalary        float64     `json:"net_salary"`
	Components       []Component `json:"components"`
	Status           string      `json:"status"` // draft, approved, rejected
}

type Service struct {
	structures map[string]*EmployeeSalaryStructure
	payslips   map[string]*PayslipBreakdown
}

func NewService() *Service {
	svc := &Service{
		structures: make(map[string]*EmployeeSalaryStructure),
		payslips:   make(map[string]*PayslipBreakdown),
	}
	// Seed mock salary structure for testing/demo
	svc.structures["emp-001"] = &EmployeeSalaryStructure{
		EmployeeID: "emp-001",
		BaseSalary: 9000000,
		Allowances: []Component{
			{Name: "Tunjangan Transport", Amount: 1000000},
			{Name: "Tunjangan Makan", Amount: 500000},
		},
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
	
	// Unpaid leave deduction = (BaseSalary / 22 working days) * unpaid_days
	dailyRate := input.BaseSalary / 22.0
	unpaidDeduction := float64(input.UnpaidLeaveDays) * dailyRate

	totalDeduction := lateDeduction + unpaidDeduction
	netSalary := gross - totalDeduction

	components := []Component{
		{Name: "Gaji Pokok", Amount: input.BaseSalary},
	}
	if input.TransportAllow > 0 {
		components = append(components, Component{Name: "Tunjangan Transport", Amount: input.TransportAllow})
	}
	if input.MealAllow > 0 {
		components = append(components, Component{Name: "Tunjangan Makan", Amount: input.MealAllow})
	}
	if lateDeduction > 0 {
		components = append(components, Component{Name: "Potongan Keterlambatan", Amount: -lateDeduction})
	}
	if unpaidDeduction > 0 {
		components = append(components, Component{Name: "Potongan Unpaid Leave", Amount: -unpaidDeduction})
	}

	result := &PayslipBreakdown{
		EmployeeID:       input.EmployeeID,
		PeriodID:         input.PeriodID,
		TotalPresent:     input.TotalPresent,
		TotalLateMinutes: input.TotalLateMinutes,
		UnpaidLeaveDays:  input.UnpaidLeaveDays,
		GrossSalary:      gross,
		TotalDeduction:   totalDeduction,
		NetSalary:        netSalary,
		Components:       components,
		Status:           "draft",
	}

	key := input.PeriodID + ":" + input.EmployeeID
	s.payslips[key] = result

	return result, nil
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

func (s *Service) GenerateBatchDraftPayslips(ctx context.Context, periodID string, employeeIDs []string) ([]*PayslipBreakdown, error) {
	var results []*PayslipBreakdown
	for _, empID := range employeeIDs {
		ps, err := s.CalculatePayslip(ctx, CalculationInput{
			EmployeeID:       empID,
			PeriodID:         periodID,
			BaseSalary:       9000000,
			TransportAllow:   1000000,
			TotalPresent:     18,
			TotalLateMinutes: 30, // 30 mins late * 5000 = 150.000 Rp
			UnpaidLeaveDays:  0,
		})
		if err == nil {
			results = append(results, ps)
		}
	}
	return results, nil
}
