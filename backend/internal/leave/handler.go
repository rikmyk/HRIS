package leave

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
	leaveGroup := router.Group("/leave", auth.ProtectedMiddleware(jwtSecret))

	leaveGroup.Get("/types", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.ListLeaveTypes)
	leaveGroup.Post("/request", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.CreateLeaveRequest)
	leaveGroup.Get("/requests", auth.RequireRoles("EMP", "MGR", "HR", "SA"), h.ListLeaveRequests)
	leaveGroup.Post("/requests/:id/approve", auth.RequireRoles("MGR", "HR", "SA"), h.ApproveRequest)
	leaveGroup.Post("/requests/:id/reject", auth.RequireRoles("MGR", "HR", "SA"), h.RejectRequest)
}

func (h *Handler) ListLeaveTypes(c *fiber.Ctx) error {
	companyID := c.Locals(auth.LocalsCompanyID).(string)
	types, err := h.service.ListLeaveTypes(c.Context(), companyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "INTERNAL_ERROR", "message": err.Error()},
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    types,
	})
}

func (h *Handler) CreateLeaveRequest(c *fiber.Ctx) error {
	var input CreateLeaveRequestInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "BAD_REQUEST", "message": "Invalid JSON body"},
		})
	}

	empID := c.Locals(auth.LocalsUserID).(string)
	input.EmployeeID = empID

	req, err := h.service.CreateLeaveRequest(c.Context(), input)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "INVALID_LEAVE_REQUEST", "message": err.Error()},
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    req,
	})
}

func (h *Handler) ListLeaveRequests(c *fiber.Ctx) error {
	role, _ := c.Locals(auth.LocalsUserRole).(string)
	var requests []*LeaveRequest
	var err error

	if role == "HR" || role == "SA" || role == "MGR" {
		requests, err = h.service.ListAllLeaveRequests(c.Context())
	} else {
		empID := c.Locals(auth.LocalsUserID).(string)
		requests, err = h.service.ListLeaveRequestsByEmployee(c.Context(), empID)
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "INTERNAL_ERROR", "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    requests,
	})
}

func (h *Handler) ApproveRequest(c *fiber.Ctx) error {
	reqID := c.Params("id")
	mgrID := c.Locals(auth.LocalsUserID).(string)

	req, err := h.service.ApproveOrRejectLeaveRequest(c.Context(), reqID, mgrID, "approve")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "APPROVAL_FAILED", "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    req,
	})
}

func (h *Handler) RejectRequest(c *fiber.Ctx) error {
	reqID := c.Params("id")
	mgrID := c.Locals(auth.LocalsUserID).(string)

	req, err := h.service.ApproveOrRejectLeaveRequest(c.Context(), reqID, mgrID, "reject")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   fiber.Map{"code": "REJECTION_FAILED", "message": err.Error()},
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    req,
	})
}
