package attendance

import (
	"context"
	"errors"
	"sync"
	"time"

	"hris/pkg/geo"
	"hris/pkg/storage"
)

var (
	ErrOutsideGeofence   = errors.New("location outside office geofence radius")
	ErrAlreadyClockedIn  = errors.New("employee already clocked in for today")
	ErrNotClockedInToday = errors.New("no clock-in record found for today")
	ErrAlreadyClockedOut = errors.New("employee already clocked out for today")
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
	ID               string     `json:"id"`
	EmployeeID       string     `json:"employee_id"`
	AttendanceDate   string     `json:"attendance_date"`
	ClockInTime      time.Time  `json:"clock_in_time"`
	ClockInPhotoURL  string     `json:"clock_in_photo_url"`
	ClockOutTime     *time.Time `json:"clock_out_time,omitempty"`
	ClockOutPhotoURL string     `json:"clock_out_photo_url,omitempty"`
	Status           string     `json:"status"` // present, late, early_leave
	LateMinutes      int        `json:"late_minutes"`
}

type RejectedLogDTO struct {
	ID             string    `json:"id"`
	EmployeeID     string    `json:"employee_id"`
	AttemptedLat   float64   `json:"attempted_lat"`
	AttemptedLng   float64   `json:"attempted_lng"`
	DistanceMeters float64   `json:"distance_meters"`
	AttemptedAt    time.Time `json:"attempted_at"`
}

type DailyAttendanceRecord struct {
	ID               string `json:"id"`
	Date             string `json:"date"`
	EmployeeCode     string `json:"employee_code"`
	EmployeeName     string `json:"employee_name"`
	Department       string `json:"department"`
	OfficeName       string `json:"office_name"`
	ClockInTime      string `json:"clock_in_time"`
	ClockInPhoto     string `json:"clock_in_photo"`
	ClockInDistance  string `json:"clock_in_distance"`
	ClockOutTime     string `json:"clock_out_time"`
	ClockOutPhoto    string `json:"clock_out_photo"`
	ClockOutDistance string `json:"clock_out_distance"`
	Status           string `json:"status"` // "valid" or "rejected_geofence"
}

type Service struct {
	storage      storage.StorageService
	mu           sync.RWMutex
	records      []*AttendanceDTO
	dailyRecords []*DailyAttendanceRecord
}

func NewService(storage storage.StorageService) *Service {
	// Seed with sample initial records
	now := time.Now()
	yesterday := now.AddDate(0, 0, -1)
	twoDaysAgo := now.AddDate(0, 0, -2)

	yClockOut := yesterday.Add(9 * time.Hour)
	tClockOut := twoDaysAgo.Add(9 * time.Hour)

	initialRecords := []*AttendanceDTO{
		{
			ID:              "att-emp-001-yesterday",
			EmployeeID:      "emp-001",
			AttendanceDate:  yesterday.Format("2006-01-02"),
			ClockInTime:     yesterday,
			ClockInPhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
			ClockOutTime:    &yClockOut,
			ClockOutPhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
			Status:          "present",
			LateMinutes:     0,
		},
		{
			ID:              "att-emp-001-twodays",
			EmployeeID:      "emp-001",
			AttendanceDate:  twoDaysAgo.Format("2006-01-02"),
			ClockInTime:     twoDaysAgo,
			ClockInPhotoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
			ClockOutTime:    &tClockOut,
			ClockOutPhotoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
			Status:          "present",
			LateMinutes:     0,
		},
	}

	initialDaily := []*DailyAttendanceRecord{
		{
			ID:               "att-2026-001",
			Date:             "26 Agu 2026",
			EmployeeCode:     "EMP-2026-001",
			EmployeeName:     "Budi Santoso",
			Department:       "Engineering",
			OfficeName:       "Head Office Jakarta",
			ClockInTime:      "08:02:15 WIB",
			ClockInPhoto:     "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
			ClockInDistance:  "35m",
			ClockOutTime:     "17:05:40 WIB",
			ClockOutPhoto:    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
			ClockOutDistance: "32m",
			Status:           "valid",
		},
		{
			ID:               "att-2026-002",
			Date:             "26 Agu 2026",
			EmployeeCode:     "EMP-2026-002",
			EmployeeName:     "Dewi Anggraini",
			Department:       "Marketing",
			OfficeName:       "Head Office Jakarta",
			ClockInTime:      "08:14:02 WIB",
			ClockInPhoto:     "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
			ClockInDistance:  "42m",
			ClockOutTime:     "17:01:10 WIB",
			ClockOutPhoto:    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
			ClockOutDistance: "40m",
			Status:           "valid",
		},
	}

	return &Service{
		storage:      storage,
		records:      initialRecords,
		dailyRecords: initialDaily,
	}
}

// ProcessClockIn validates GPS distance via Haversine and stores the record.
func (s *Service) ProcessClockIn(ctx context.Context, req ClockInRequest) (*AttendanceDTO, float64, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	distance := geo.HaversineDistance(req.AttemptedLat, req.AttemptedLng, req.OfficeLat, req.OfficeLng)

	if distance > req.RadiusMeters {
		return nil, distance, ErrOutsideGeofence
	}

	now := time.Now()
	status := "present"
	lateMinutes := 0
	if now.Hour() > 8 || (now.Hour() == 8 && now.Minute() > 0) {
		status = "late"
		lateMinutes = (now.Hour()-8)*60 + now.Minute()
	}

	photoURL := "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
	if s.storage != nil {
		objName := storage.GeneratePhotoObjectName(req.EmployeeID, "clockin")
		url, err := s.storage.UploadFile(ctx, "attendance", objName, nil, req.PhotoSize, req.PhotoContentType)
		if err == nil {
			photoURL = url
		}
	}

	record := &AttendanceDTO{
		ID:              "att-" + req.EmployeeID + "-" + now.Format("150405"),
		EmployeeID:      req.EmployeeID,
		AttendanceDate:  now.Format("2006-01-02"),
		ClockInTime:     now,
		ClockInPhotoURL: photoURL,
		Status:          status,
		LateMinutes:     lateMinutes,
	}

	// Prepend to records list so newest is first
	s.records = append([]*AttendanceDTO{record}, s.records...)

	return record, distance, nil
}

// ProcessClockOut records clock-out time for the active record.
func (s *Service) ProcessClockOut(ctx context.Context, req ClockOutRequest) (*AttendanceDTO, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	todayStr := now.Format("2006-01-02")

	for _, rec := range s.records {
		if rec.EmployeeID == req.EmployeeID && rec.AttendanceDate == todayStr {
			rec.ClockOutTime = &now
			rec.ClockOutPhotoURL = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80"
			return rec, nil
		}
	}

	// If no record exists for today, create a completed record
	record := &AttendanceDTO{
		ID:              "att-" + req.EmployeeID + "-out-" + now.Format("150405"),
		EmployeeID:      req.EmployeeID,
		AttendanceDate:  todayStr,
		ClockInTime:     now.Add(-8 * time.Hour),
		ClockInPhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
		ClockOutTime:    &now,
		ClockOutPhotoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
		Status:          "present",
		LateMinutes:     0,
	}
	s.records = append([]*AttendanceDTO{record}, s.records...)
	return record, nil
}

// GetAttendanceHistory returns all stored records for an employee.
func (s *Service) GetAttendanceHistory(empID string) []*AttendanceDTO {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var userRecords []*AttendanceDTO
	for _, rec := range s.records {
		if empID == "" || rec.EmployeeID == empID {
			userRecords = append(userRecords, rec)
		}
	}
	return userRecords
}

// UpsertDailyRecord adds or updates a daily attendance record sent from mobile or web admin.
func (s *Service) UpsertDailyRecord(rec *DailyAttendanceRecord) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, existing := range s.dailyRecords {
		if existing.EmployeeCode == rec.EmployeeCode && existing.Date == rec.Date {
			if rec.ClockInTime != "" && rec.ClockInTime != "-" {
				existing.ClockInTime = rec.ClockInTime
				if rec.ClockInPhoto != "" {
					existing.ClockInPhoto = rec.ClockInPhoto
				}
				existing.ClockInDistance = rec.ClockInDistance
			}
			if rec.ClockOutTime != "" && rec.ClockOutTime != "-" {
				existing.ClockOutTime = rec.ClockOutTime
				if rec.ClockOutPhoto != "" {
					existing.ClockOutPhoto = rec.ClockOutPhoto
				}
				existing.ClockOutDistance = rec.ClockOutDistance
			}
			if rec.Status != "" {
				existing.Status = rec.Status
			}
			s.dailyRecords[i] = existing
			return
		}
	}

	s.dailyRecords = append([]*DailyAttendanceRecord{rec}, s.dailyRecords...)
}

// GetAllDailyRecords returns all daily attendance records.
func (s *Service) GetAllDailyRecords() []*DailyAttendanceRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.dailyRecords
}
