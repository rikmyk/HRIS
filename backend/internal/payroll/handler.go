package payroll

import (
	"github.com/gofiber/fiber/v2"
	"hris/internal/auth"
	"hris/pkg/storage"
)

type Handler struct {
	service *Service
}

func NewHandler(storageSvc storage.StorageService) *Handler {
	return &Handler{
		service: NewService(storageSvc),
	}
}

func (h *Handler) RegisterRoutes(router fiber.Router, jwtSecret string) {
	// Public & direct download endpoints for PDF streaming (browser window.open & mobile deep link)
	router.Get("/payroll/public/payslips/:id/pdf", h.DownloadPayslipPDF)

	payrollGroup := router.Group("/payroll", auth.ProtectedMiddleware(jwtSecret))
	payrollGroup.Get("/payslips/:id/pdf", h.DownloadPayslipPDF)

	payrollGroup.Get("/salary-structure/:employee_id", auth.RequireRoles("HR", "SA", "MGR"), h.GetSalaryStructure)
	payrollGroup.Post("/calculate", auth.RequireRoles("HR", "SA"), h.CalculateSinglePayslip)
	payrollGroup.Post("/batch-generate", auth.RequireRoles("HR", "SA"), h.GenerateBatchPayslips)

	// Phase 4: Approval & Payment Routes
	payrollGroup.Get("/payslips", auth.RequireRoles("HR", "SA", "MGR"), h.ListPayslips)
	payrollGroup.Get("/my-payslip", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.GetMyPayslip)
	payrollGroup.Post("/payslips/:id/approve", auth.RequireRoles("HR", "SA"), h.ApprovePayslip)
	payrollGroup.Post("/payslips/bulk-approve", auth.RequireRoles("HR", "SA"), h.BulkApprovePayslips)
	payrollGroup.Post("/payslips/:id/mark-paid", auth.RequireRoles("HR", "SA"), h.MarkAsPaid)
	payrollGroup.Post("/payslips/bulk-mark-paid", auth.RequireRoles("HR", "SA"), h.BulkMarkAsPaid)
}

func (h *Handler) DownloadPayslipPDF(c *fiber.Ctx) error {
	psID := c.Params("id")
	htmlBytes, err := h.service.GeneratePDFBytes(c.Context(), psID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "PAYSLIP_GEN_FAILED", "message": err.Error()},
		})
	}

	// Serve as HTML so the browser can render the styled payslip.
	// Users can Print → Save as PDF (Ctrl+P) for high-quality PDF output.
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.Send(htmlBytes)
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

func (h *Handler) ListPayslips(c *fiber.Ctx) error {
	periodID := c.Query("period_id", "period-2026-08")
	list, err := h.service.ListPayslipsByPeriod(c.Context(), periodID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "INTERNAL_ERROR", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    list,
	})
}

func (h *Handler) GetMyPayslip(c *fiber.Ctx) error {
	empID := c.Locals(auth.LocalsUserID).(string)
	periodID := c.Query("period_id", "period-2026-08")

	ps, err := h.service.GetPayslipForEmployee(c.Context(), empID, periodID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "PAYSLIP_NOT_FOUND", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    ps,
	})
}

func (h *Handler) ApprovePayslip(c *fiber.Ctx) error {
	psID := c.Params("id")
	actorID := c.Locals(auth.LocalsUserID).(string)

	ps, err := h.service.ApprovePayslip(c.Context(), psID, actorID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "APPROVAL_FAILED", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    ps,
	})
}

func (h *Handler) BulkApprovePayslips(c *fiber.Ctx) error {
	actorID := c.Locals(auth.LocalsUserID).(string)
	periodID := c.Query("period_id", "period-2026-08")

	count, err := h.service.BulkApprovePayslips(c.Context(), periodID, actorID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "BULK_APPROVAL_FAILED", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success":        true,
		"approved_count": count,
	})
}

func (h *Handler) MarkAsPaid(c *fiber.Ctx) error {
	psID := c.Params("id")
	actorID := c.Locals(auth.LocalsUserID).(string)

	type MarkPaidInput struct {
		PaymentReference string `json:"payment_reference"`
	}
	var input MarkPaidInput
	_ = c.BodyParser(&input)
	if input.PaymentReference == "" {
		input.PaymentReference = "TRF-MANUAL-202608"
	}

	ps, err := h.service.MarkAsPaid(c.Context(), psID, actorID, input.PaymentReference)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "MARK_PAID_FAILED", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    ps,
	})
}

func (h *Handler) BulkMarkAsPaid(c *fiber.Ctx) error {
	actorID := c.Locals(auth.LocalsUserID).(string)

	type BulkMarkPaidInput struct {
		PayslipIDs       []string `json:"payslip_ids"`
		PaymentReference string   `json:"payment_reference"`
	}
	var input BulkMarkPaidInput
	_ = c.BodyParser(&input)
	if input.PaymentReference == "" {
		input.PaymentReference = "TRF-BATCH-202608"
	}

	count, err := h.service.BulkMarkAsPaid(c.Context(), input.PayslipIDs, actorID, input.PaymentReference)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "BULK_MARK_PAID_FAILED", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success":    true,
		"paid_count": count,
	})
}
