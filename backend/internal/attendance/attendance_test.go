package attendance

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"hris/internal/auth"
	"hris/pkg/storage"
)

const testSecretKey = "attendance_test_secret_32bytes"

func TestAttendanceHandler_GeofenceScenarios(t *testing.T) {
	mockStore := storage.NewMockMinIOStorage("localhost:9000", "attendance", false)
	handler := NewHandler(mockStore)

	app := fiber.New()
	api := app.Group("/v1")
	handler.RegisterRoutes(api, testSecretKey)

	empToken, _ := auth.GenerateTokenPair("emp-001", "comp-001", "EMP", testSecretKey)

	// Scenario 1: Clock-in inside office radius (Office: -6.2088, 106.8456)
	formInside := url.Values{}
	formInside.Set("latitude", "-6.2088")
	formInside.Set("longitude", "106.8456")

	req1 := httptest.NewRequest("POST", "/v1/attendance/clock-in", strings.NewReader(formInside.Encode()))
	req1.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req1.Header.Set("Authorization", "Bearer "+empToken.AccessToken)

	resp1, _ := app.Test(req1)
	if resp1.StatusCode != http.StatusCreated {
		t.Errorf("Expected 201 Created for clock-in inside geofence, got %d", resp1.StatusCode)
	}

	// Scenario 2: Clock-in outside office radius (> 100m away: -6.2150, 106.8500)
	formOutside := url.Values{}
	formOutside.Set("latitude", "-6.2150")
	formOutside.Set("longitude", "106.8500")

	req2 := httptest.NewRequest("POST", "/v1/attendance/clock-in", strings.NewReader(formOutside.Encode()))
	req2.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req2.Header.Set("Authorization", "Bearer "+empToken.AccessToken)

	resp2, _ := app.Test(req2)
	if resp2.StatusCode != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for clock-in outside geofence, got %d", resp2.StatusCode)
	}
}
