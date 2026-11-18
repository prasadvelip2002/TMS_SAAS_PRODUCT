using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using api_backend.Services.Interfaces;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LocationsController : ControllerBase
    {
        private readonly ILocationService _locationService;

        public LocationsController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        // GET: api/Locations/live
        // Returns active fleet vehicles with live coordinates, driver info, and tracking badges.
        // Super Admins see all branches or can filter by branchId.
        // Branch Managers/Supervisors/Dispatchers strictly see ONLY vehicles in their assigned branch.
        [HttpGet("live")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLiveFleet([FromQuery] int? branchId)
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var userBranchIdClaim = User.FindFirst("BranchId")?.Value;
            int? userBranchId = int.TryParse(userBranchIdClaim, out var bid) && bid > 0 ? bid : null;

            bool isGlobalAdmin = roleClaim == "Tenant Admin" 
                              || roleClaim == "Admin" 
                              || roleClaim == "Super Admin" 
                              || roleClaim == "Director/Operations Head" 
                              || roleClaim == "Platform Admin";

            int? effectiveBranchId = null;

            if (isGlobalAdmin)
            {
                // Super Admin / Tenant Admin can see all branches or filter by requested branchId
                if (branchId.HasValue && branchId.Value > 0)
                {
                    effectiveBranchId = branchId.Value;
                }
            }
            else if (userBranchId.HasValue)
            {
                // Branch Manager / Supervisor: strictly enforce their own branch!
                effectiveBranchId = userBranchId.Value;
            }
            else if (branchId.HasValue)
            {
                // Explicit branch passed via query parameter from client session
                effectiveBranchId = branchId.Value;
            }
            else
            {
                // Non-admin without assigned branch: isolate to empty to prevent fleet leakage
                effectiveBranchId = -1;
            }

            var fleet = await _locationService.GetLiveFleetLocationsAsync(effectiveBranchId);
            return Ok(fleet);
        }

        // POST: api/Locations/ping
        // Ingests live mobile GPS telemetry from Android / iOS driver apps or mobile browser
        [HttpPost("ping")]
        [AllowAnonymous]
        public async Task<IActionResult> RecordMobilePing([FromBody] MobileLocationPingDto dto)
        {
            if (dto.TripId <= 0)
            {
                return BadRequest(new { message = "Valid TripId is required." });
            }

            try
            {
                var location = await _locationService.RecordMobilePingAsync(dto);
                return Ok(new
                {
                    message = "Mobile GPS location recorded successfully",
                    location.Id,
                    location.TripId,
                    location.Latitude,
                    location.Longitude,
                    location.Speed,
                    location.Accuracy,
                    location.Source,
                    location.Provider,
                    location.RecordedAt,
                    location.ReceivedAt
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/Locations/sim/ping/{tripId}
        // Triggers a network-based SIM LBS query via Dotmove for a keypad-phone driver
        [HttpPost("sim/ping/{tripId}")]
        [AllowAnonymous]
        public async Task<IActionResult> FetchSimLocation(int tripId)
        {
            var location = await _locationService.FetchSimLocationAsync(tripId);
            if (location == null)
            {
                return BadRequest(new { message = "Could not fetch SIM location. Ensure driver has a phone number registered." });
            }

            return Ok(new
            {
                message = "SIM location updated via telecom cell tower",
                location.Id,
                location.TripId,
                location.Latitude,
                location.Longitude,
                location.Accuracy,
                location.Source,
                location.RecordedAt
            });
        }

        // POST: api/Locations/sim/consent/{driverId}
        // Initiates TRAI-compliant SMS consent to driver's SIM for Dotmove tracking
        [HttpPost("sim/consent/{driverId}")]
        [AllowAnonymous]
        public async Task<IActionResult> RequestSimConsent(int driverId)
        {
            var result = await _locationService.RequestSimConsentAsync(driverId);
            return Ok(result);
        }

        // GET: api/Locations/trip/{tripId}/history
        // Returns historical breadcrumbs for route playback
        [HttpGet("trip/{tripId}/history")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTripHistory(int tripId)
        {
            var history = await _locationService.GetTripTrailHistoryAsync(tripId);
            return Ok(history);
        }

        // GET: api/Locations/driver/trip/{tripId}
        // Public mobile driver portal endpoint to view assigned trip details
        [HttpGet("driver/trip/{tripId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetDriverTrip(int tripId)
        {
            var details = await _locationService.GetDriverTripDetailsAsync(tripId);
            if (details == null) return NotFound(new { message = $"Trip #{tripId} not found." });
            return Ok(details);
        }

        // POST: api/Locations/driver/start/{tripId}
        // Driver taps 'Start Trip' on their smartphone
        [HttpPost("driver/start/{tripId}")]
        [AllowAnonymous]
        public async Task<IActionResult> StartTripByDriver(int tripId)
        {
            var success = await _locationService.StartTripByDriverAsync(tripId);
            if (!success) return BadRequest(new { message = $"Could not start Trip #{tripId}." });
            return Ok(new { message = "Trip started successfully. Mobile GPS tracking is now ACTIVE.", status = "In_Transit" });
        }

        // POST: api/Locations/driver/complete/{tripId}
        // Driver arrives at destination and completes trip
        [HttpPost("driver/complete/{tripId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CompleteTripByDriver(int tripId)
        {
            var success = await _locationService.CompleteTripByDriverAsync(tripId);
            if (!success) return BadRequest(new { message = $"Could not complete Trip #{tripId}." });
            return Ok(new { message = "Trip marked as completed. GPS tracking ended.", status = "Completed" });
        }

        // GET: api/Locations/trip/{tripId}/telemetry
        // Live full telemetry for any individual trip with dynamic origin, destination, current position, speed, and ETA
        [HttpGet("trip/{tripId}/telemetry")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTripTelemetry(int tripId)
        {
            var telemetry = await _locationService.GetTripTelemetryAsync(tripId);
            if (telemetry == null)
            {
                return NotFound(new { message = $"Trip #{tripId} telemetry not found." });
            }
            return Ok(telemetry);
        }

        // GET: api/Locations/track/{token}
        // Public live shareable tracking magic link endpoint for customers / consignees (Uber/Amazon style)
        [HttpGet("track/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCustomerTracking(string token)
        {
            var tracking = await _locationService.GetCustomerTrackingAsync(token);
            if (tracking == null)
            {
                return NotFound(new { message = $"Consignment tracking link '{token}' is invalid or expired." });
            }
            return Ok(tracking);
        }

        // GET: api/Locations/nearby?pincode=560058&radiusKm=50&branchId=...
        // Discovers all available/active vehicles in that region / radius around any Indian PIN code
        [HttpGet("nearby")]
        [AllowAnonymous]
        public async Task<IActionResult> GetVehiclesNearby([FromQuery] string pincode, [FromQuery] double radiusKm = 50.0, [FromQuery] int? branchId = null)
        {
            if (string.IsNullOrWhiteSpace(pincode))
            {
                return BadRequest(new { message = "Valid PIN code or locality name is required." });
            }

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var userBranchIdClaim = User.FindFirst("BranchId")?.Value;
            int? userBranchId = int.TryParse(userBranchIdClaim, out var bid) && bid > 0 ? bid : null;

            bool isGlobalAdmin = roleClaim == "Tenant Admin" 
                              || roleClaim == "Admin" 
                              || roleClaim == "Super Admin" 
                              || roleClaim == "Director/Operations Head" 
                              || roleClaim == "Platform Admin";

            int? effectiveBranchId = null;
            if (isGlobalAdmin)
            {
                if (branchId.HasValue && branchId.Value > 0) effectiveBranchId = branchId.Value;
            }
            else if (userBranchId.HasValue)
            {
                effectiveBranchId = userBranchId.Value;
            }
            else if (branchId.HasValue && branchId.Value > 0)
            {
                effectiveBranchId = branchId.Value;
            }

            var result = await _locationService.GetVehiclesNearPincodeAsync(pincode, radiusKm, effectiveBranchId);
            return Ok(result);
        }

        // GET: api/Locations/geocode?query=...&contextCity=...
        // Dynamic geocoding service for any Indian 6-digit Pincode, city, warehouse, or locality
        [HttpGet("geocode")]
        [AllowAnonymous]
        public async Task<IActionResult> Geocode([FromQuery] string query, [FromQuery] string? contextCity = null)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Query string or 6-digit PIN code is required." });
            }
            var result = await _locationService.GeocodeDetailedAsync(query, contextCity);
            return Ok(result);
        }

        // GET: api/Locations/reverse?lat=...&lng=...
        // Dynamic reverse geocoding to resolve street/corridor/city from coordinates
        [HttpGet("reverse")]
        [AllowAnonymous]
        public async Task<IActionResult> ReverseGeocode([FromQuery] double lat, [FromQuery] double lng)
        {
            if (lat == 0 && lng == 0)
            {
                return BadRequest(new { message = "Valid coordinates are required." });
            }
            var address = await _locationService.ReverseGeocodeAsync(lat, lng);
            return Ok(new { latitude = lat, longitude = lng, address = address ?? "India Corridor" });
        }

        // POST: api/Locations/reset-test-pings
        // Cleans up any test telemetry pings and restores authentic timestamps
        [HttpPost("reset-test-pings")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetTestPings()
        {
            await _locationService.ResetTestPingsAsync();
            return Ok(new { message = "Reset test telemetry successfully." });
        }
    }
}
