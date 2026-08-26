package geo

import (
	"math"
	"testing"
)

func TestHaversineDistance_SameLocation(t *testing.T) {
	lat, lon := -6.200000, 106.816666
	dist := HaversineDistance(lat, lon, lat, lon)

	if dist > 0.001 {
		t.Errorf("Expected distance 0 for same point, got %f", dist)
	}
}

func TestHaversineDistance_KnownPoints(t *testing.T) {
	// Monas Jakarta (-6.175392, 106.827153) to GBK Senayan (-6.218333, 106.802222)
	// Approx distance ~ 5.5 km (5500m)
	dist := HaversineDistance(-6.175392, 106.827153, -6.218333, 106.802222)
	expectedMin := 5400.0
	expectedMax := 5600.0

	if dist < expectedMin || dist > expectedMax {
		t.Errorf("Expected distance between 5400m and 5600m, got %f", dist)
	}
}

func TestIsWithinRadius_BoundaryCases(t *testing.T) {
	officeLat, officeLon := -6.200000, 106.816666
	radius := 100.0 // 100 meters

	// Point 50 meters away -> inside
	// 0.00045 degrees lat is ~ 50 meters
	userInsideLat := officeLat + 0.00040
	if !IsWithinRadius(userInsideLat, officeLon, officeLat, officeLon, radius) {
		t.Errorf("Expected user to be within 100m radius")
	}

	// Point 500 meters away -> outside
	userOutsideLat := officeLat + 0.00500
	if IsWithinRadius(userOutsideLat, officeLon, officeLat, officeLon, radius) {
		t.Errorf("Expected user to be outside 100m radius")
	}
}

func TestIsWithinRadius_ExactRadiusBoundary(t *testing.T) {
	officeLat, officeLon := -6.200000, 106.816666
	// Point at exact distance equal to radius
	dist := HaversineDistance(officeLat, officeLon, officeLat+0.0008, officeLon)
	if !IsWithinRadius(officeLat+0.0008, officeLon, officeLat, officeLon, math.Ceil(dist)) {
		t.Errorf("Expected point within radius equal to distance")
	}
}
