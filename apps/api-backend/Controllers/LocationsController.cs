using System;
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
        // Returns all active fleet vehicles with live coordinates, driver info, and tracking badges
        [HttpGet("live")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLiveFleet()
        {
            var fleet = await _locationService.GetLiveFleetLocationsAsync();
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
                    location.RecordedAt
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
    }
}
