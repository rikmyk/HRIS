package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

const testSecret = "super_secret_test_key_32_bytes_len"

func TestGenerateAndValidateToken(t *testing.T) {
	pair, err := GenerateTokenPair("user-123", "comp-456", "HR", testSecret)
	if err != nil {
		t.Fatalf("Failed to generate token pair: %v", err)
	}

	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Fatalf("Expected non-empty tokens")
	}

	claims, err := ValidateToken(pair.AccessToken, testSecret)
	if err != nil {
		t.Fatalf("Failed to validate access token: %v", err)
	}

	if claims.UserID != "user-123" || claims.Role != "HR" || claims.TokenType != "access" {
		t.Errorf("Unexpected claims: %+v", claims)
	}
}

func TestValidateToken_InvalidKey(t *testing.T) {
	pair, _ := GenerateTokenPair("user-123", "comp-456", "EMP", testSecret)
	_, err := ValidateToken(pair.AccessToken, "wrong_secret_key")
	if err == nil {
		t.Errorf("Expected error when validating with wrong secret")
	}
}

func TestPasswordHashing(t *testing.T) {
	rawPassword := "Password123!"
	hashed, err := bcrypt.GenerateFromPassword([]byte(rawPassword), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if err := bcrypt.CompareHashAndPassword(hashed, []byte(rawPassword)); err != nil {
		t.Errorf("Expected password hash match")
	}

	if err := bcrypt.CompareHashAndPassword(hashed, []byte("WrongPassword")); err == nil {
		t.Errorf("Expected failure for incorrect password")
	}
}

func TestRBACMiddleware(t *testing.T) {
	app := fiber.New()
	secret := "test_jwt_secret"

	app.Get("/protected-hr", ProtectedMiddleware(secret), RequireRoles("HR"), func(c *fiber.Ctx) error {
		return c.SendString("HR Access Granted")
	})

	// Case 1: Missing Token -> 401
	req1 := httptest.NewRequest("GET", "/protected-hr", nil)
	resp1, _ := app.Test(req1)
	if resp1.StatusCode != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for missing token, got %d", resp1.StatusCode)
	}

	// Case 2: Employee Token accessing HR route -> 403 Forbidden
	empToken, _ := GenerateTokenPair("emp-1", "comp-1", "EMP", secret)
	req2 := httptest.NewRequest("GET", "/protected-hr", nil)
	req2.Header.Set("Authorization", "Bearer "+empToken.AccessToken)
	resp2, _ := app.Test(req2)
	if resp2.StatusCode != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for EMP accessing HR route, got %d", resp2.StatusCode)
	}

	// Case 3: HR Token accessing HR route -> 200 OK
	hrToken, _ := GenerateTokenPair("hr-1", "comp-1", "HR", secret)
	req3 := httptest.NewRequest("GET", "/protected-hr", nil)
	req3.Header.Set("Authorization", "Bearer "+hrToken.AccessToken)
	resp3, _ := app.Test(req3)
	if resp3.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK for HR accessing HR route, got %d", resp3.StatusCode)
	}

	// Case 4: Super Admin (SA) Token accessing HR route -> 200 OK
	saToken, _ := GenerateTokenPair("sa-1", "comp-1", "SA", secret)
	req4 := httptest.NewRequest("GET", "/protected-hr", nil)
	req4.Header.Set("Authorization", "Bearer "+saToken.AccessToken)
	resp4, _ := app.Test(req4)
	if resp4.StatusCode != http.StatusOK {
		t.Errorf("Expected 200 OK for Super Admin accessing HR route, got %d", resp4.StatusCode)
	}
}
