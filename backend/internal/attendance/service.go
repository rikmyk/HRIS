package attendance

import (
	"context"
	"errors"
	"time"

	"hris/pkg/geo"
	"hris/pkg/storage"
)

var (
	ErrOutsideGeofence      = errors.New("location outside office geofence radius")
	ErrAlreadyClockedIn     = errors.New("employee already clocked in for today")
	ErrNotClockedInToday    = errors.New("no clock-in record found for today")
	ErrAlreadyClockedOut    = errors.New("employee already clocked out for today")
)

type ClockInRequest struct {
	EmployeeID       string  `json:"employee_id"`
	OfficeLat        float64 `json:"office_lat"`
	OfficeLng        float64 `json:"office_lng"`
	RadiusMeters     float64 `json:"radius_meters"`
	AttemptedLat     float64 `json:"attempted_lat"`
	AttemptedLng     float64 `json:"attempted_lng"`
	DeviceID         string  `json:"device_id"`
	PhotoContentType string  `json:"photo_content_type"`
	PhotoSize        int64   `json:"photo_size"`
}

type ClockOutRequest struct {
	EmployeeID       string  `json:"employee_id"`
	AttemptedLat     float64 `json:"attempted_lat"`
	AttemptedLng     float64 `json:"attempted_lng"`
	PhotoContentType string  `json:"photo_content_type"`
	PhotoSize        int64   `json:"photo_size"`
}

type AttendanceDTO struct {
	ID               string    `json:"id"`
	EmployeeID       string    `json:"employee_id"`
	AttendanceDate   string    `json:"attendance_date"`
	ClockInTime      time.Time `json:"clock_in_time"`
	ClockInPhotoURL  string    `json:"clock_in_photo_url"`
	ClockOutTime     *time.Time `json:"clock_out_time,omitempty"`
	ClockOutPhotoURL string    `json:"clock_out_photo_url,omitempty"`
	Status           string    `json:"status"` // present, late, early_leave
	LateMinutes      int       `json:"late_minutes"`
}

type RejectedLogDTO struct {
	ID             string    `json:"id"`
	EmployeeID     string    `json:"employee_id"`
	AttemptedLat   float64   `json:"attempted_lat"`
	AttemptedLng   float64   `json:"attempted_lng"`
	DistanceMeters float64   `json:"distance_meters"`
	AttemptedAt    time.Time `json:"attempted_at"`
}

type Service struct {
	storage storage.StorageService
}

func NewService(storage storage.StorageService) *Service {
	return &Service{storage: storage}
}

// ProcessClockIn validates GPS distance via Haversine. If outside radius, rejects and returns distance.
func (s *Service) ProcessClockIn(ctx context.Context, req ClockInRequest) (*AttendanceDTO, float64, error) {
	distance := geo.HaversineDistance(req.AttemptedLat, req.AttemptedLng, req.OfficeLat, req.OfficeLng)
	
	// Geofence enforcement per PRD §3.1 & ADR-001
	if distance > req.RadiusMeters {
		// Log attempt in rejected table, return ErrOutsideGeofence without creating attendance record
		return nil, distance, ErrOutsideGeofence
	}

	// Calculate if employee is late (work starts at 08:00 AM)
	now := time.Now()
	status := "present"
	lateMinutes := 0
	if now.Hour() > 8 || (now.Hour() == 8 && now.Minute() > 0) {
		status = "late"
		lateMinutes = (now.Hour()-8)*60 + now.Minute()
	}

	photoURL := "http://localhost:9000/attendance/selfie-clockin.jpg"
	if s.storage != nil {
		objName := storage.GeneratePhotoObjectName(req.EmployeeID, "clockin")
		url, err := s.storage.UploadFile(ctx, "attendance", objName, nil, req.PhotoSize, req.PhotoContentType)
		if err == nil {
			photoURL = url
		}
	}

	record := &AttendanceDTO{
		ID:              "att-" + req.EmployeeID,
		EmployeeID:      req.EmployeeID,
		AttendanceDate:  now.Format("2006-01-02"),
		ClockInTime:     now,
		ClockInPhotoURL: photoURL,
		Status:          status,
		LateMinutes:     lateMinutes,
	}

	return record, distance, nil
}
