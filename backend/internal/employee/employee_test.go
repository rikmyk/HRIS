package employee

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"hris/internal/auth"
)

const testSecretKey = "employee_test_secret_key_32bytes"

func TestValidateOfficeLocation(t *testing.T) {
	valid := OfficeLocationInput{
		Name:         "Jakarta HQ",
		Latitude:     -6.2088,
		Longitude:    106.8456,
		RadiusMeters: 100,
	}
	if err := ValidateOfficeLocation(valid); err != nil {
		t.Errorf("Expected valid office location, got %v", err)
	}

	invalidLat := OfficeLocationInput{
		Name:         "Invalid Lat",
		Latitude:     -95.0,
		Longitude:    106.8456,
		RadiusMeters: 100,
	}
	if err := ValidateOfficeLocation(invalidLat); err != ErrInvalidCoordinates {
		t.Errorf("Expected ErrInvalidCoordinates, got %v", err)
	}

	invalidRadius := OfficeLocationInput{
		Name:         "Invalid Radius",
		Latitude:     -6.2088,
		Longitude:    106.8456,
		RadiusMeters: 0,
	}
	if err := ValidateOfficeLocation(invalidRadius); err != ErrInvalidRadius {
		t.Errorf("Expected ErrInvalidRadius, got %v", err)
	}
}

func TestEmployeeHandler_Endpoints(t *testing.T) {
	app := fiber.New()
	handler := NewHandler()
	api := app.Group("/v1")
	handler.RegisterRoutes(api, testSecretKey)

	hrToken, _ := auth.GenerateTokenPair("hr-user", "company-1", "HR", testSecretKey)
	empToken, _ := auth.GenerateTokenPair("emp-user", "company-1", "EMP", testSecretKey)

	// 1. GET /v1/employees with HR token -> 200 OK
	req1 := httptest.NewRequest("GET", "/v1/employees/", nil)
	req1.Header.Set("Authorization", "Bearer "+hrToken.AccessToken)
	resp1, _ := app.Test(req1)
	if resp1.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK for HR listing employees, got %d", resp1.StatusCode)
	}

	// 2. GET /v1/employees with EMP token -> 403 Forbidden
	req2 := httptest.NewRequest("GET", "/v1/employees/", nil)
	req2.Header.Set("Authorization", "Bearer "+empToken.AccessToken)
	resp2, _ := app.Test(req2)
	if resp2.StatusCode != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for EMP listing employees, got %d", resp2.StatusCode)
	}

	// 3. POST /v1/office-locations with valid payload -> 201 Created
	payload := OfficeLocationInput{
		Name:         "Surabaya Branch",
		Latitude:     -7.2575,
		Longitude:    112.7521,
		RadiusMeters: 150,
	}
	body, _ := json.Marshal(payload)
	req3 := httptest.NewRequest("POST", "/v1/office-locations/", bytes.NewReader(body))
	req3.Header.Set("Content-Type", "application/json")
	req3.Header.Set("Authorization", "Bearer "+hrToken.AccessToken)
	resp3, _ := app.Test(req3)
	if resp3.StatusCode != http.StatusCreated {
		t.Errorf("Expected 201 Created for creating office location, got %d", resp3.StatusCode)
	}
}
