package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

const (
	LocalsUserID    = "user_id"
	LocalsCompanyID = "company_id"
	LocalsUserRole  = "user_role"
)

// ProtectedMiddleware verifies the JWT access token from the Authorization header
func ProtectedMiddleware(secretKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		tokenStr := ""
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			tokenStr = c.Query("token")
		}

		if tokenStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Missing authorization token",
				},
			})
		}

		if strings.HasPrefix(tokenStr, "demo-") {
			// Demo/Development fallback context for instant testing
			role := "EMP"
			if strings.Contains(tokenStr, "admin") || strings.Contains(tokenStr, "hr") || strings.Contains(tokenStr, "sa") {
				role = "SA"
			}
			c.Locals(LocalsUserID, "emp-001")
			c.Locals(LocalsCompanyID, "comp-001")
			c.Locals(LocalsUserRole, role)
			return c.Next()
		}

		claims, err := ValidateToken(tokenStr, secretKey)
		if err != nil || claims.TokenType != "access" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "Invalid or expired authorization token",
				},
			})
		}

		// Store user context in Fiber Locals
		c.Locals(LocalsUserID, claims.UserID)
		c.Locals(LocalsCompanyID, claims.CompanyID)
		c.Locals(LocalsUserRole, claims.Role)

		return c.Next()
	}
}

// RequireRoles enforces RBAC role restrictions for an endpoint
func RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole, ok := c.Locals(LocalsUserRole).(string)
		if !ok || userRole == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNAUTHORIZED",
					"message": "User role identity missing",
				},
			})
		}

		// Super Admin (SA) bypasses all role checks
		if userRole == "SA" {
			return c.Next()
		}

		for _, allowed := range allowedRoles {
			if userRole == allowed {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error": fiber.Map{
				"code":    "FORBIDDEN",
				"message": "You do not have permission to access this resource",
			},
		})
	}
}
