package employee

import (
	"github.com/gofiber/fiber/v2"
	"hris/internal/auth"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) RegisterRoutes(router fiber.Router, jwtSecret string) {
	emp := router.Group("/employees", auth.ProtectedMiddleware(jwtSecret))
	
	// HR Admin & Super Admin endpoints
	emp.Get("/", auth.RequireRoles("HR", "SA", "MGR"), h.ListEmployees)
	emp.Post("/", auth.RequireRoles("HR", "SA"), h.CreateEmployee)
	emp.Get("/:id", auth.RequireRoles("HR", "SA", "MGR", "EMP"), h.GetEmployeeByID)

	off := router.Group("/office-locations", auth.ProtectedMiddleware(jwtSecret))
	off.Get("/", auth.RequireRoles("HR", "SA", "MGR", "EMP"), h.ListOfficeLocations)
	off.Post("/", auth.RequireRoles("HR", "SA"), h.CreateOfficeLocation)
}

func (h *Handler) ListEmployees(c *fiber.Ctx) error {
	// Sample response adhering to API Spec §2
	return c.JSON(fiber.Map{
		"success": true,
		"data": []fiber.Map{
			{
				"id":                "emp-001",
				"employee_code":     "EMP-2026-001",
				"full_name":         "Budi Santoso",
				"department_name":   "Engineering",
				"position_title":    "Senior Software Engineer",
				"office_name":       "Head Office Jakarta",
				"employment_status": "permanent",
			},
			{
				"id":                "emp-002",
				"employee_code":     "EMP-2026-002",
				"full_name":         "Siti Rahma",
				"department_name":   "Human Resources",
				"position_title":    "HR Specialist",
				"office_name":       "Head Office Jakarta",
				"employment_status": "permanent",
			},
		},
	})
}

func (h *Handler) CreateEmployee(c *fiber.Ctx) error {
	var input CreateEmployeeInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "BAD_REQUEST",
				"message": "Invalid request payload",
			},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":            "emp-new-id",
			"employee_code": input.EmployeeCode,
			"full_name":     input.FullName,
			"status":        "created",
		},
	})
}

func (h *Handler) GetEmployeeByID(c *fiber.Ctx) error {
	id := c.Params("id")
	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":            id,
			"employee_code": "EMP-2026-001",
			"full_name":     "Budi Santoso",
		},
	})
}

func (h *Handler) ListOfficeLocations(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data": []fiber.Map{
			{
				"id":            "off-001",
				"name":          "Head Office Jakarta",
				"latitude":      -6.2088,
				"longitude":     106.8456,
				"radius_meters": 100,
			},
		},
	})
}

func (h *Handler) CreateOfficeLocation(c *fiber.Ctx) error {
	var input OfficeLocationInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "BAD_REQUEST",
				"message": "Invalid payload",
			},
		})
	}

	if err := ValidateOfficeLocation(input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "INVALID_COORDINATES",
				"message": err.Error(),
			},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":            "off-new-id",
			"name":          input.Name,
			"latitude":      input.Latitude,
			"longitude":     input.Longitude,
			"radius_meters": input.RadiusMeters,
		},
	})
}
