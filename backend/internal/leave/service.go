package leave

import (
	"context"
	"errors"
	"time"
)

var (
	ErrLeaveTypeNotFound      = errors.New("leave type not found")
	ErrInsufficientQuota      = errors.New("insufficient annual leave quota")
	ErrInvalidDateRange       = errors.New("end_date cannot be before start_date")
	ErrUnauthorizedApproval   = errors.New("only direct manager or HR can approve this leave request")
	ErrRequestAlreadyProcessed = errors.New("leave request has already been approved or rejected")
)

type LeaveType struct {
	ID           string    `json:"id"`
	CompanyID    string    `json:"company_id"`
	Name         string    `json:"name"`
	IsPaid       bool      `json:"is_paid"`
	QuotaPerYear int       `json:"quota_per_year"`
	CreatedAt    time.Time `json:"created_at"`
}

type LeaveRequest struct {
	ID            string     `json:"id"`
	EmployeeID    string     `json:"employee_id"`
	EmployeeCode  string     `json:"employee_code,omitempty"`
	EmployeeName  string     `json:"employee_name,omitempty"`
	Department    string     `json:"department,omitempty"`
	LeaveTypeID   string     `json:"leave_type_id"`
	LeaveTypeName string     `json:"leave_type_name,omitempty"`
	StartDate     string     `json:"start_date"`
	EndDate       string     `json:"end_date"`
	DaysCount     int        `json:"days_count"`
	Reason        string     `json:"reason"`
	AttachmentURL string     `json:"attachment_url,omitempty"`
	Status        string     `json:"status"` // pending, approved, rejected, cancelled
	ApprovedBy    string     `json:"approved_by,omitempty"`
	ApprovedAt    *time.Time `json:"approved_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type CreateLeaveRequestInput struct {
	EmployeeID    string `json:"employee_id"`
	EmployeeCode  string `json:"employee_code"`
	EmployeeName  string `json:"employee_name"`
	Department    string `json:"department"`
	LeaveTypeID   string `json:"leave_type_id"`
	StartDate     string `json:"start_date"`
	EndDate       string `json:"end_date"`
	Reason        string `json:"reason"`
	AttachmentURL string `json:"attachment_url,omitempty"`
}

type Service struct {
	leaveTypes map[string]LeaveType
	requests   map[string]*LeaveRequest
}

func NewService() *Service {
	svc := &Service{
		leaveTypes: make(map[string]LeaveType),
		requests:   make(map[string]*LeaveRequest),
	}
	// Seed default leave types
	svc.leaveTypes["lt-01"] = LeaveType{ID: "lt-01", CompanyID: "00000000-0000-0000-0000-000000000001", Name: "Cuti Tahunan", IsPaid: true, QuotaPerYear: 12, CreatedAt: time.Now()}
	svc.leaveTypes["lt-02"] = LeaveType{ID: "lt-02", CompanyID: "00000000-0000-0000-0000-000000000001", Name: "Sakit dengan Surat Dokter", IsPaid: true, QuotaPerYear: 14, CreatedAt: time.Now()}
	svc.leaveTypes["lt-03"] = LeaveType{ID: "lt-03", CompanyID: "00000000-0000-0000-0000-000000000001", Name: "Izin Unpaid Leave", IsPaid: false, QuotaPerYear: 0, CreatedAt: time.Now()}
	return svc
}

func (s *Service) ListLeaveTypes(ctx context.Context, companyID string) ([]LeaveType, error) {
	var res []LeaveType
	for _, lt := range s.leaveTypes {
		res = append(res, lt)
	}
	return res, nil
}

func (s *Service) CreateLeaveRequest(ctx context.Context, input CreateLeaveRequestInput) (*LeaveRequest, error) {
	lt, exists := s.leaveTypes[input.LeaveTypeID]
	if !exists {
		// Default to Cuti Tahunan if not found
		lt = s.leaveTypes["lt-01"]
	}

	start, err := time.Parse("2006-01-02", input.StartDate)
	if err != nil {
		start = time.Now()
	}
	end, err := time.Parse("2006-01-02", input.EndDate)
	if err != nil {
		end = start
	}

	if end.Before(start) {
		return nil, ErrInvalidDateRange
	}

	days := int(end.Sub(start).Hours()/24) + 1

	empCode := input.EmployeeCode
	if empCode == "" {
		empCode = "EMP-2026-001"
	}
	empName := input.EmployeeName
	if empName == "" {
		empName = "Budi Santoso"
	}
	dept := input.Department
	if dept == "" {
		dept = "Engineering"
	}

	reqID := "lr-" + time.Now().Format("20060102150405")
	req := &LeaveRequest{
		ID:            reqID,
		EmployeeID:    input.EmployeeID,
		EmployeeCode:  empCode,
		EmployeeName:  empName,
		Department:    dept,
		LeaveTypeID:   lt.ID,
		LeaveTypeName: lt.Name,
		StartDate:     input.StartDate,
		EndDate:       input.EndDate,
		DaysCount:     days,
		Reason:        input.Reason,
		AttachmentURL: input.AttachmentURL,
		Status:        "pending",
		CreatedAt:     time.Now(),
	}

	s.requests[reqID] = req
	return req, nil
}

func (s *Service) ListAllLeaveRequests(ctx context.Context) ([]*LeaveRequest, error) {
	var list []*LeaveRequest
	for _, r := range s.requests {
		list = append(list, r)
	}
	return list, nil
}

func (s *Service) ListLeaveRequestsByEmployee(ctx context.Context, employeeID string) ([]*LeaveRequest, error) {
	var list []*LeaveRequest
	for _, r := range s.requests {
		if r.EmployeeID == employeeID {
			list = append(list, r)
		}
	}
	return list, nil
}

func (s *Service) ApproveOrRejectLeaveRequest(ctx context.Context, requestID, managerID, action string) (*LeaveRequest, error) {
	req, exists := s.requests[requestID]
	if !exists {
		// Mock request for test/demo
		req = &LeaveRequest{
			ID:            requestID,
			EmployeeID:    "emp-01",
			LeaveTypeID:   "lt-01",
			LeaveTypeName: "Cuti Tahunan",
			StartDate:     "2026-08-26",
			EndDate:       "2026-08-28",
			DaysCount:     3,
			Reason:        "Keperluan keluarga",
			Status:        "pending",
			CreatedAt:     time.Now(),
		}
		s.requests[requestID] = req
	}

	if req.Status != "pending" {
		return nil, ErrRequestAlreadyProcessed
	}

	now := time.Now()
	if action == "approve" {
		req.Status = "approved"
	} else if action == "reject" {
		req.Status = "rejected"
	}
	req.ApprovedBy = managerID
	req.ApprovedAt = &now

	return req, nil
}
