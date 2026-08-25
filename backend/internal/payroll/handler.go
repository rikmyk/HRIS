package payroll

import (
	"github.com/gofiber/fiber/v2"
	"hris/internal/auth"
)

type Handler struct {
	service *Service
}

func NewHandler() *Handler {
	return &Handler{
		service: NewService(),
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router, jwtSecret string) {
	payrollGroup := router.Group("/payroll", auth.ProtectedMiddleware(jwtSecret))

	payrollGroup.Get("/salary-structure/:employee_id", auth.RequireRoles("HR", "SA", "MGR"), h.GetSalaryStructure)
	payrollGroup.Post("/calculate", auth.RequireRoles("HR", "SA"), h.CalculateSinglePayslip)
	payrollGroup.Post("/batch-generate", auth.RequireRoles("HR", "SA"), h.GenerateBatchPayslips)
}

func (h *Handler) GetSalaryStructure(c *fiber.Ctx) error {
	empID := c.Params("employee_id")
	st, err := h.service.GetEmployeeSalaryStructure(c.Context(), empID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "STRUCTURE_NOT_FOUND", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    st,
	})
}

func (h *Handler) CalculateSinglePayslip(c *fiber.Ctx) error {
	var input CalculationInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "BAD_REQUEST", "message": "Invalid JSON payload"},
		})
	}

	result, err := h.service.CalculatePayslip(c.Context(), input)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "CALCULATION_ERROR", "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}

func (h *Handler) GenerateBatchPayslips(c *fiber.Ctx) error {
	type BatchInput struct {
		PeriodID    string   `json:"period_id"`
		EmployeeIDs []string `json:"employee_ids"`
	}

	var req BatchInput
	if err := c.BodyParser(&req); err != nil {
		req.PeriodID = "period-2026-08"
		req.EmployeeIDs = []string{"emp-001", "emp-002", "emp-003"}
	}

	results, err := h.service.GenerateBatchDraftPayslips(c.Context(), req.PeriodID, req.EmployeeIDs)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "BATCH_GENERATION_FAILED", "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    results,
		"count":   len(results),
	})
}
