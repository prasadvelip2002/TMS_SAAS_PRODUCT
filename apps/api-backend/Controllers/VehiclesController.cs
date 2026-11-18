using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Controllers
{
    public class VehicleLocationDetailDto
    {
        public int Id { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Type { get; set; }
        public decimal Capacity { get; set; }
        public string? OwnerName { get; set; }
        public string? RCNumber { get; set; }
        public DateTime? InsuranceExpiry { get; set; }
        public DateTime? PermitExpiry { get; set; }
        public DateTime? FitnessExpiry { get; set; }
        public int? VendorId { get; set; }
        public string? VendorName { get; set; }
        public string? VendorPhone { get; set; }
        public string? VendorCity { get; set; }
        public string? Status { get; set; }

        public double CurrentLat { get; set; }
        public double CurrentLng { get; set; }
        public string CurrentAddress { get; set; } = "Base Depot";
        public string TrackingStatus { get; set; } = "STANDBY";
        public string TrackingType { get; set; } = "MOBILE_GPS";
        public DateTime? LastPingTime { get; set; }

        public double? DistanceFromPincodeKm { get; set; }
        public bool IsNearby { get; set; } = false;
    }

    public class NearbyVehiclesResultDto
    {
        public string Pincode { get; set; } = string.Empty;
        public string? PickupLocation { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double RadiusKm { get; set; } = 50.0;
        public int TotalCount { get; set; }
        public int NearbyCount { get; set; }
        public int OtherCount { get; set; }
        public List<VehicleLocationDetailDto> NearbyVehicles { get; set; } = new();
        public List<VehicleLocationDetailDto> OtherVehicles { get; set; } = new();
    }

    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class VehiclesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILocationService _locationService;

        public VehiclesController(ApplicationDbContext context, ILocationService locationService)
        {
            _context = context;
            _locationService = locationService;
        }

        // GET: api/Vehicles/nearby?pincode=560058&radiusKm=50&isOwnFleet=false
        [HttpGet("nearby")]
        public async Task<ActionResult<NearbyVehiclesResultDto>> GetNearbyVehicles(
            [FromQuery] string pincode, 
            [FromQuery] double radiusKm = 50.0, 
            [FromQuery] bool? isOwnFleet = null)
        {
            if (string.IsNullOrWhiteSpace(pincode))
            {
                return BadRequest("Pincode is required.");
            }

            var geocode = await _locationService.GeocodeDetailedAsync(pincode.Trim());
            var pinLat = geocode.Latitude;
            var pinLng = geocode.Longitude;

            var query = _context.Vehicles.Include(v => v.Vendor).AsQueryable();
            if (isOwnFleet.HasValue)
            {
                if (isOwnFleet.Value)
                    query = query.Where(v => v.VendorId == null);
                else
                    query = query.Where(v => v.VendorId != null);
            }

            var vehicles = await query.ToListAsync();

            // Load live locations dictionary
            var vehicleIds = vehicles.Select(v => v.Id).ToList();
            var liveLocations = await _context.VehicleCurrentLocations
                .IgnoreQueryFilters()
                .Where(v => vehicleIds.Contains(v.VehicleId))
                .ToDictionaryAsync(v => v.VehicleId);

            // Pre-resolve vendor base cities dynamically in parallel (0ms if cached, instant response)
            var distinctCities = vehicles
                .Where(v => v.Vendor != null && !string.IsNullOrWhiteSpace(v.Vendor.City))
                .Select(v => v.Vendor!.City!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var cityTasks = distinctCities.Select(async city => 
            {
                var coords = await _locationService.GeocodeLocationAsync(city);
                return (City: city, Coords: coords);
            });
            var cityResults = await Task.WhenAll(cityTasks);
            var cityMap = cityResults.ToDictionary(x => x.City, x => x.Coords, StringComparer.OrdinalIgnoreCase);

            var detailedList = new List<VehicleLocationDetailDto>();

            foreach (var v in vehicles)
            {
                double vLat = 0.0;
                double vLng = 0.0;
                string vAddress = "Depot Location";
                string trackingStatus = "STANDBY";
                string trackingType = "MOBILE_GPS";
                DateTime? lastPing = null;

                if (liveLocations.TryGetValue(v.Id, out var loc) && loc.Latitude != 0 && loc.Longitude != 0)
                {
                    vLat = loc.Latitude;
                    vLng = loc.Longitude;
                    vAddress = loc.Address ?? "Live Tracking Active";
                    trackingStatus = loc.TrackingStatus ?? "LIVE";
                    trackingType = loc.TrackingType ?? "MOBILE_GPS";
                    lastPing = loc.LastLocationAt;
                }
                else if (v.Vendor != null && !string.IsNullOrWhiteSpace(v.Vendor.City) && cityMap.TryGetValue(v.Vendor.City.Trim(), out var coords))
                {
                    vLat = coords.Lat;
                    vLng = coords.Lng;
                    vAddress = $"{v.Vendor.City}, {v.Vendor.State ?? "India"}";
                    trackingStatus = "BASE_DEPOT";
                }
                else if (!string.IsNullOrWhiteSpace(v.OwnerName))
                {
                    vAddress = $"{v.OwnerName} Fleet Base";
                }

                double? distKm = null;
                bool isNearby = false;

                if (pinLat != 0 && pinLng != 0 && vLat != 0 && vLng != 0)
                {
                    distKm = Math.Round(CalculateDistanceKm(pinLat, pinLng, vLat, vLng), 1);
                    isNearby = distKm.Value <= radiusKm;
                }

                detailedList.Add(new VehicleLocationDetailDto
                {
                    Id = v.Id,
                    VehicleNumber = v.VehicleNumber,
                    Code = v.Code,
                    Type = v.Type,
                    Capacity = v.Capacity,
                    OwnerName = v.OwnerName,
                    RCNumber = v.RCNumber,
                    InsuranceExpiry = v.InsuranceExpiry,
                    PermitExpiry = v.PermitExpiry,
                    FitnessExpiry = v.FitnessExpiry,
                    VendorId = v.VendorId,
                    VendorName = v.Vendor?.Name,
                    VendorPhone = v.Vendor?.Phone,
                    VendorCity = v.Vendor?.City,
                    Status = v.Status,
                    CurrentLat = vLat,
                    CurrentLng = vLng,
                    CurrentAddress = vAddress,
                    TrackingStatus = trackingStatus,
                    TrackingType = trackingType,
                    LastPingTime = lastPing,
                    DistanceFromPincodeKm = distKm,
                    IsNearby = isNearby
                });
            }

            var nearby = detailedList.Where(v => v.IsNearby).OrderBy(v => v.DistanceFromPincodeKm ?? double.MaxValue).ToList();
            var others = detailedList.Where(v => !v.IsNearby).OrderBy(v => v.DistanceFromPincodeKm ?? double.MaxValue).ToList();

            return Ok(new NearbyVehiclesResultDto
            {
                Pincode = geocode.Pincode ?? pincode,
                PickupLocation = geocode.DisplayName ?? $"PIN {pincode}",
                Latitude = pinLat,
                Longitude = pinLng,
                RadiusKm = radiusKm,
                TotalCount = detailedList.Count,
                NearbyCount = nearby.Count,
                OtherCount = others.Count,
                NearbyVehicles = nearby,
                OtherVehicles = others
            });
        }

        private static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
        {
            if (lat1 == 0 || lon1 == 0 || lat2 == 0 || lon2 == 0) return 99999.0;
            var rlat1 = Math.PI * lat1 / 180.0;
            var rlat2 = Math.PI * lat2 / 180.0;
            var theta = lon1 - lon2;
            var rtheta = Math.PI * theta / 180.0;
            var dist = Math.Sin(rlat1) * Math.Sin(rlat2) + Math.Cos(rlat1) * Math.Cos(rlat2) * Math.Cos(rtheta);
            if (dist > 1.0) dist = 1.0;
            dist = Math.Acos(dist);
            dist = dist * 180.0 / Math.PI;
            dist = dist * 60.0 * 1.1515 * 1.609344;
            return dist;
        }

        // GET: api/Vehicles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles([FromQuery] bool? isOwnFleet)
        {
            var query = _context.Vehicles.Include(v => v.Vendor).AsQueryable();
            if (isOwnFleet.HasValue)
            {
                if (isOwnFleet.Value)
                {
                    query = query.Where(v => v.VendorId == null);
                }
                else
                {
                    query = query.Where(v => v.VendorId != null);
                }
            }
            return await query.ToListAsync();
        }

        // GET: api/Vehicles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Vehicle>> GetVehicle(int id)
        {
            var vehicle = await _context.Vehicles.Include(v => v.Vendor).FirstOrDefaultAsync(v => v.Id == id);

            if (vehicle == null)
            {
                return NotFound();
            }

            return vehicle;
        }

        // POST: api/Vehicles
        [HttpPost]
        public async Task<ActionResult<Vehicle>> PostVehicle(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
        }

        // PUT: api/Vehicles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehicle(int id, Vehicle vehicle)
        {
            if (id != vehicle.Id)
            {
                return BadRequest();
            }

            // Update properties
            var existingVehicle = await _context.Vehicles.FindAsync(id);
            if (existingVehicle == null)
            {
                return NotFound();
            }

            existingVehicle.VehicleNumber = vehicle.VehicleNumber;
            existingVehicle.Code = vehicle.Code;
            existingVehicle.Type = vehicle.Type;
            existingVehicle.Capacity = vehicle.Capacity;
            existingVehicle.OwnerName = vehicle.OwnerName;
            existingVehicle.RCNumber = vehicle.RCNumber;
            existingVehicle.InsuranceExpiry = vehicle.InsuranceExpiry;
            existingVehicle.PermitExpiry = vehicle.PermitExpiry;
            existingVehicle.FitnessExpiry = vehicle.FitnessExpiry;
            existingVehicle.VendorId = vehicle.VendorId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VehicleExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Vehicles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id)
        {
            var vehicle = await _context.Vehicles.FindAsync(id);
            if (vehicle == null)
            {
                return NotFound();
            }

            _context.Vehicles.Remove(vehicle);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool VehicleExists(int id)
        {
            return _context.Vehicles.Any(e => e.Id == id);
        }
    }
}

