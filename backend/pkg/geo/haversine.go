package geo

import "math"

// EarthRadiusMeters is the mean radius of Earth in meters.
const EarthRadiusMeters = 6371000.0

// HaversineDistance calculates the great-circle distance between two points
// (lat1, lon1) and (lat2, lon2) on Earth in meters using the Haversine formula.
func HaversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	dLat := (lat2 - lat1) * math.Pi / 180.0
	dLon := (lon2 - lon1) * math.Pi / 180.0

	radLat1 := lat1 * math.Pi / 180.0
	radLat2 := lat2 * math.Pi / 180.0

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Sin(dLon/2)*math.Sin(dLon/2)*math.Cos(radLat1)*math.Cos(radLat2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return EarthRadiusMeters * c
}

// IsWithinRadius returns true if the distance between (userLat, userLon) and (officeLat, officeLon)
// is less than or equal to radiusMeters.
func IsWithinRadius(userLat, userLon, officeLat, officeLon, radiusMeters float64) bool {
	dist := HaversineDistance(userLat, userLon, officeLat, officeLon)
	return dist <= radiusMeters
}
