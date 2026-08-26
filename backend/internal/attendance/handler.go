package attendance

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"hris/internal/auth"
	"hris/pkg/storage"
)

type Handler struct {
	service *Service
}

func NewHandler(storage storage.StorageService) *Handler {
	return &Handler{
		service: NewService(storage),
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router, jwtSecret string) {
	att := router.Group("/attendance", auth.ProtectedMiddleware(jwtSecret))

	att.Post("/clock-in", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.ClockIn)
	att.Post("/clock-out", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.ClockOut)
	att.Post("/sync", h.SyncDailyRecord)
	att.Get("/records", h.GetAllDailyRecords)
	att.Get("/history", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.GetHistory)
	att.Get("/rejected-logs", auth.RequireRoles("HR", "SA", "MGR"), h.GetRejectedLogs)
	att.Get("/monitoring", auth.RequireRoles("HR", "SA", "MGR"), h.GetMonitoringMap)
}

func (h *Handler) ClockIn(c *fiber.Ctx) error {
	var body struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}
	_ = c.BodyParser(&body)

	latStr := c.FormValue("latitude")
	lngStr := c.FormValue("longitude")
	if latStr != "" {
		body.Latitude, _ = strconv.ParseFloat(latStr, 64)
	}
	if lngStr != "" {
		body.Longitude, _ = strconv.ParseFloat(lngStr, 64)
	}
	if body.Latitude == 0 && body.Longitude == 0 {
		body.Latitude = -6.2088
		body.Longitude = 106.8456
	}

	empID, _ := c.Locals(auth.LocalsUserID).(string)
	if empID == "" {
		empID = "emp-001"
	}

	req := ClockInRequest{
		EmployeeID:       empID,
		OfficeLat:        -6.2088,
		OfficeLng:        106.8456,
		RadiusMeters:     100, // 100 meters geofence radius
		AttemptedLat:     body.Latitude,
		AttemptedLng:     body.Longitude,
		PhotoContentType: "image/jpeg",
	}

	record, distance, err := h.service.ProcessClockIn(c.Context(), req)
	if err == ErrOutsideGeofence {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":            "GEOFENCE_REJECTED",
				"message":         "Lokasi Anda di luar radius geofence kantor",
				"distance_meters": distance,
				"allowed_radius":  100,
			},
		})
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": err.Error(),
			},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    record,
	})
}

func (h *Handler) ClockOut(c *fiber.Ctx) error {
	empID, _ := c.Locals(auth.LocalsUserID).(string)
	if empID == "" {
		empID = "emp-001"
	}

	req := ClockOutRequest{
		EmployeeID:       empID,
		AttemptedLat:     -6.2088,
		AttemptedLng:     106.8456,
		PhotoContentType: "image/jpeg",
	}

	record, err := h.service.ProcessClockOut(c.Context(), req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INTERNAL_ERROR",
				"message": err.Error(),
			},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    record,
	})
}

func (h *Handler) GetHistory(c *fiber.Ctx) error {
	empID, _ := c.Locals(auth.LocalsUserID).(string)
	if empID == "" {
		empID = "emp-001"
	}

	records := h.service.GetAttendanceHistory(empID)
	return c.JSON(fiber.Map{
		"success": true,
		"data":    records,
	})
}

func (h *Handler) GetRejectedLogs(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data": []fiber.Map{
			{
				"id":              "rej-001",
				"employee_name":   "Budi Santoso",
				"attempted_at":    "2026-08-25T07:55:00Z",
				"distance_meters": 450.5,
				"device_id":       "iPhone-15-Pro",
			},
		},
	})
}

func (h *Handler) GetMonitoringMap(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"summary": fiber.Map{
				"total_employees": 120,
				"present_count":   108,
				"late_count":      8,
				"rejected_count":  2,
				"absent_count":    2,
			},
			"pins": []fiber.Map{
				{
					"employee_name": "Budi Santoso",
					"status":        "present",
					"lat":           -6.2088,
					"lng":           106.8456,
				},
				{
					"employee_name": "Ahmad Fauzi",
					"status":        "rejected",
					"lat":           -6.2150,
					"lng":           106.8500,
				},
			},
		},
	})
}

func (h *Handler) SyncDailyRecord(c *fiber.Ctx) error {
	var rec DailyAttendanceRecord
	if err := c.BodyParser(&rec); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"message": "Invalid JSON body"},
		})
	}
	if rec.ID == "" {
		rec.ID = "att-" + strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	h.service.UpsertDailyRecord(&rec)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    rec,
	})
}

func (h *Handler) GetAllDailyRecords(c *fiber.Ctx) error {
	records := h.service.GetAllDailyRecords()
	return c.JSON(fiber.Map{
		"success": true,
		"data":    records,
	})
}
