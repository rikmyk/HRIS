package employee

import (
	"errors"
	"time"
)

var (
	ErrInvalidCoordinates = errors.New("latitude must be between -90 and 90, longitude between -180 and 180")
	ErrInvalidRadius      = errors.New("radius meters must be greater than 0")
	ErrEmployeeNotFound   = errors.New("employee not found")
	ErrOfficeNotFound     = errors.New("office location not found")
)

type OfficeLocationInput struct {
	CompanyID    string  `json:"company_id"`
	Name         string  `json:"name"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	RadiusMeters int     `json:"radius_meters"`
}

type CreateEmployeeInput struct {
	UserID           string `json:"user_id"`
	DepartmentID     string `json:"department_id"`
	PositionID       string `json:"position_id"`
	OfficeLocationID string `json:"office_location_id"`
	ManagerID        string `json:"manager_id,omitempty"`
	EmployeeCode     string `json:"employee_code"`
	FullName         string `json:"full_name"`
	JoinDate         string `json:"join_date"`
	EmploymentStatus string `json:"employment_status"` // permanent, contract, intern
	BankAccountNo    string `json:"bank_account_no"`
	BankName         string `json:"bank_name"`
}

// ValidateOfficeLocation ensures coordinates and radius comply with geofence constraints
func ValidateOfficeLocation(input OfficeLocationInput) error {
	if input.Latitude < -90.0 || input.Latitude > 90.0 {
		return ErrInvalidCoordinates
	}
	if input.Longitude < -180.0 || input.Longitude > 180.0 {
		return ErrInvalidCoordinates
	}
	if input.RadiusMeters <= 0 {
		return ErrInvalidRadius
	}
	return nil
}

type EmployeeDTO struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	EmployeeCode     string    `json:"employee_code"`
	FullName         string    `json:"full_name"`
	DepartmentName   string    `json:"department_name"`
	PositionTitle    string    `json:"position_title"`
	OfficeName       string    `json:"office_name"`
	EmploymentStatus string    `json:"employment_status"`
	JoinDate         string    `json:"join_date"`
	CreatedAt        time.Time `json:"created_at"`
}
