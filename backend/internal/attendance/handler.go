package attendance

import (
	"strconv"

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
	att.Get("/history", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.GetHistory)
	att.Get("/rejected-logs", auth.RequireRoles("HR", "SA", "MGR"), h.GetRejectedLogs)
	att.Get("/monitoring", auth.RequireRoles("HR", "SA", "MGR"), h.GetMonitoringMap)
}

func (h *Handler) ClockIn(c *fiber.Ctx) error {
	latStr := c.FormValue("latitude")
	lngStr := c.FormValue("longitude")
	
	lat, _ := strconv.ParseFloat(latStr, 64)
	lng, _ := strconv.ParseFloat(lngStr, 64)
	empID := c.Locals(auth.LocalsUserID).(string)

	req := ClockInRequest{
		EmployeeID:       empID,
		OfficeLat:        -6.2088,
		OfficeLng:        106.8456,
		RadiusMeters:     100, // 100 meters geofence radius
		AttemptedLat:     lat,
		AttemptedLng:     lng,
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
	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"status":    "clocked_out",
			"timestamp": "17:05:00",
		},
	})
}

func (h *Handler) GetHistory(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data": []fiber.Map{
			{
				"date":         "2026-08-25",
				"clock_in":     "08:14:00",
				"clock_out":    "17:05:00",
				"status":       "present",
				"late_minutes": 0,
			},
			{
				"date":         "2026-08-24",
				"clock_in":     "08:42:00",
				"clock_out":    "17:10:00",
				"status":       "late",
				"late_minutes": 42,
			},
		},
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
