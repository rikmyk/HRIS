package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"hris/internal/attendance"
	"hris/internal/leave"
	"hris/internal/payroll"
	"hris/pkg/storage"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "HRIS API v1.0",
	})

	app.Use(logger.New())
	app.Use(recover.New())

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "super-secret-hris-jwt-key-2026"
	}

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "ok",
			"service": "hris-api",
		})
	})

	// API v1 group
	v1 := app.Group("/v1")
	v1.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "HRIS API v1 Root",
		})
	})

	// Storage Service Mock/MinIO Client
	storageSvc := storage.NewMockMinIOStorage("localhost:9000", "hris-photos", false)

	// Register Handlers
	attendanceHandler := attendance.NewHandler(storageSvc)
	attendanceHandler.RegisterRoutes(v1, jwtSecret)

	leaveHandler := leave.NewHandler()
	leaveHandler.RegisterRoutes(v1, jwtSecret)

	payrollHandler := payroll.NewHandler()
	payrollHandler.RegisterRoutes(v1, jwtSecret)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Starting HRIS API process on port %s...\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Error starting API server: %v", err)
	}
}
