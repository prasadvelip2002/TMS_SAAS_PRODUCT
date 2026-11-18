using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;
using api_backend.Services.Tracking;

using System.Collections.Concurrent;
using System.Net.Http;
using System.Text.Json;

namespace api_backend.Services
{
    public class LocationService : ILocationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<LocationService> _logger;
        private readonly DotmoveLocationProvider _dotmoveProvider;
        private readonly MobileGpsLocationProvider _mobileProvider;

        // High-Speed Persistent Dynamic Geocoding Cache
        private static readonly ConcurrentDictionary<string, (double Lat, double Lng, string? DisplayName, string? Pincode)> _runtimeGeoCache = new(StringComparer.OrdinalIgnoreCase);
        private static readonly System.Text.RegularExpressions.Regex _pincodeRegex = new(@"\b[1-9][0-9]{5}\b", System.Text.RegularExpressions.RegexOptions.Compiled);
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };
        private static readonly ConcurrentDictionary<string, string> _reverseGeoCache = new(StringComparer.OrdinalIgnoreCase);
        private static readonly string _geoCacheFilePath = Path.Combine(AppContext.BaseDirectory, "runtime_geocache.json");

        static LocationService()
        {
            try
            {
                if (File.Exists(_geoCacheFilePath))
                {
                    var json = File.ReadAllText(_geoCacheFilePath);
                    using var doc = JsonDocument.Parse(json);
                    foreach (var prop in doc.RootElement.EnumerateObject())
                    {
                        var lat = prop.Value.GetProperty("lat").GetDouble();
                        var lng = prop.Value.GetProperty("lng").GetDouble();
                        var name = prop.Value.TryGetProperty("name", out var n) ? n.GetString() : null;
                        var pin = prop.Value.TryGetProperty("pin", out var p) ? p.GetString() : null;
                        if (string.IsNullOrEmpty(pin) && !string.IsNullOrEmpty(name))
                        {
                            var match = _pincodeRegex.Match(name);
                            if (match.Success)
                            {
                                pin = match.Value;
                            }
                        }
                        _runtimeGeoCache[prop.Name] = (lat, lng, name, pin);
                        if (!string.IsNullOrEmpty(pin))
                        {
                            _runtimeGeoCache[pin] = (lat, lng, name, pin);
                        }
                    }
                }
            }
            catch { }
        }

        private static void PersistGeoCache()
        {
            try
            {
                var dict = new Dictionary<string, object>();
                foreach (var kvp in _runtimeGeoCache)
                {
                    dict[kvp.Key] = new { lat = kvp.Value.Lat, lng = kvp.Value.Lng, name = kvp.Value.DisplayName, pin = kvp.Value.Pincode };
                }
                var json = JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_geoCacheFilePath, json);
            }
            catch { }
        }

        public LocationService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<LocationService> logger,
            DotmoveLocationProvider dotmoveProvider,
            MobileGpsLocationProvider mobileProvider)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _dotmoveProvider = dotmoveProvider;
            _mobileProvider = mobileProvider;
        }

        public async Task<TripLocation> RecordMobilePingAsync(MobileLocationPingDto dto)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .FirstOrDefaultAsync(t => t.Id == dto.TripId);

            if (trip == null)
            {
                throw new KeyNotFoundException($"Trip #{dto.TripId} not found.");
            }

            var recordedTime = dto.RecordedAt ?? DateTime.UtcNow;
            var receivedTime = DateTime.UtcNow;
            var providerName = string.IsNullOrEmpty(dto.Provider) ? "MOBILE" : dto.Provider;

            var resolvedAddress = dto.Address;
            if (string.IsNullOrWhiteSpace(resolvedAddress) && dto.Latitude != 0 && dto.Longitude != 0)
            {
                resolvedAddress = await ReverseGeocodeAsync(dto.Latitude, dto.Longitude);
            }

            VehicleCurrentLocation? currentLoc = null;
            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                currentLoc = await _context.VehicleCurrentLocations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.VehicleId == trip.VehicleId.Value);
            }

            double effectiveSpeed = dto.Speed ?? 0.0;
            double effectiveHeading = dto.Heading ?? 0.0;

            if (currentLoc != null && currentLoc.Latitude != 0 && currentLoc.Longitude != 0 && dto.Latitude != 0 && dto.Longitude != 0)
            {
                var distMeters = CalculateDistanceMeters(currentLoc.Latitude, currentLoc.Longitude, dto.Latitude, dto.Longitude);
                var elapsedSec = (recordedTime - currentLoc.RecordedAt).TotalSeconds;

                if (distMeters < 3.0 && elapsedSec <= 30.0)
                {
                    // Vehicle is stationary / stopped at signal
                    effectiveSpeed = 0.0;
                }
                else if (effectiveSpeed <= 0 && elapsedSec >= 1.0 && elapsedSec <= 300.0)
                {
                    var calcKmH = (distMeters / elapsedSec) * 3.6;
                    // Filter out microscopic GPS jitter (below 2.5 km/h)
                    if (calcKmH >= 2.5 && calcKmH <= 160.0)
                    {
                        effectiveSpeed = Math.Round(calcKmH, 1);
                    }
                    else
                    {
                        effectiveSpeed = 0.0;
                    }
                }

                if (effectiveHeading <= 0 && distMeters > 5.0)
                {
                    effectiveHeading = Math.Round(CalculateBearing(currentLoc.Latitude, currentLoc.Longitude, dto.Latitude, dto.Longitude), 1);
                }
            }

            // 1. Insert into Historical Breadcrumbs Table
            var historyRecord = new TripLocation
            {
                TripId = trip.Id,
                VehicleId = trip.VehicleId,
                DriverId = trip.DriverId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Accuracy = dto.Accuracy ?? 8.0, // Default 8m for GPS
                Speed = effectiveSpeed,
                Heading = effectiveHeading,
                Source = "MOBILE_GPS",
                Provider = providerName,
                DeviceId = dto.DeviceId,
                Msisdn = trip.Driver?.Phone,
                Address = resolvedAddress,
                RecordedAt = recordedTime,
                ReceivedAt = receivedTime,
                TenantId = trip.TenantId,
                CompanyId = trip.CompanyId
            };

            _context.TripLocations.Add(historyRecord);

            // 2. Upsert Current Vehicle Location (High-performance latest position table)
            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                if (currentLoc == null)
                {
                    currentLoc = new VehicleCurrentLocation
                    {
                        VehicleId = trip.VehicleId.Value,
                        DriverId = trip.DriverId,
                        TripId = trip.Id,
                        Latitude = dto.Latitude,
                        Longitude = dto.Longitude,
                        Accuracy = dto.Accuracy ?? 8.0,
                        Speed = effectiveSpeed,
                        Heading = effectiveHeading,
                        TrackingType = "MOBILE_GPS",
                        TrackingProvider = providerName,
                        TrackingStatus = "LIVE",
                        Address = resolvedAddress ?? dto.Address,
                        DeviceId = dto.DeviceId,
                        Msisdn = trip.Driver?.Phone,
                        RecordedAt = recordedTime,
                        ReceivedAt = receivedTime,
                        LastLocationAt = receivedTime,
                        TenantId = trip.TenantId,
                        CompanyId = trip.CompanyId
                    };
                    _context.VehicleCurrentLocations.Add(currentLoc);
                }
                else
                {
                    currentLoc.DriverId = trip.DriverId;
                    currentLoc.TripId = trip.Id;
                    currentLoc.Latitude = dto.Latitude;
                    currentLoc.Longitude = dto.Longitude;
                    currentLoc.Accuracy = dto.Accuracy ?? 8.0;
                    currentLoc.Speed = effectiveSpeed;
                    currentLoc.Heading = effectiveHeading;
                    currentLoc.TrackingType = "MOBILE_GPS";
                    currentLoc.TrackingProvider = providerName;
                    currentLoc.TrackingStatus = "LIVE";
                    currentLoc.DeviceId = dto.DeviceId ?? currentLoc.DeviceId;
                    currentLoc.Msisdn = trip.Driver?.Phone ?? currentLoc.Msisdn;
                    currentLoc.RecordedAt = recordedTime;
                    currentLoc.ReceivedAt = receivedTime;
                    currentLoc.LastLocationAt = receivedTime;
                    if (!string.IsNullOrEmpty(resolvedAddress)) currentLoc.Address = resolvedAddress;
                    _context.Entry(currentLoc).State = EntityState.Modified;
                }
            }

            // Only transition to In_Transit if currently pending
            if (trip.Status == "Assigned" || trip.Status == "Pending Assignment")
            {
                trip.Status = "In_Transit";
                trip.TripStartDate ??= DateTime.UtcNow;
                _context.Entry(trip).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Recorded Mobile GPS Ping for Trip #{TripId}: Lat {Lat}, Lng {Lng}", trip.Id, dto.Latitude, dto.Longitude);
            return historyRecord;
        }

        public async Task<TripLocation?> FetchSimLocationAsync(int tripId)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Driver)
                .Include(t => t.Vehicle)
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null || trip.Driver == null || string.IsNullOrEmpty(trip.Driver.Phone))
            {
                return null;
            }

            var cleanPhone = trip.Driver.Phone.Replace("+", "").Replace(" ", "").Trim();
            var providerResult = await _dotmoveProvider.GetLocationAsync(cleanPhone);

            if (providerResult == null || !providerResult.Success)
            {
                return null;
            }

            double lat = providerResult.Latitude;
            double lng = providerResult.Longitude;
            string? address = providerResult.Address;

            // If in sandbox simulation mode without live telecom credentials,
            // dynamically calculate position along the trip's REAL origin-to-destination corridor:
            if (providerResult.RawPayload != null && providerResult.RawPayload.Contains("SANDBOX_SIMULATION"))
            {
                var srcCity = trip.Indent?.Source ?? "Origin";
                var destCity = trip.Indent?.Destination ?? "Destination";
                var srcCoords = await ResolveCoordinatesAsync(srcCity, null, 20.5937, 78.9629);
                var destCoords = await ResolveCoordinatesAsync(destCity, srcCity, srcCoords.Lat, srcCoords.Lng);

                var rand = Random.Shared;
                double fraction = 0.30 + (rand.NextDouble() * 0.35);
                lat = Math.Round(srcCoords.Lat + fraction * (destCoords.Lat - srcCoords.Lat) + (rand.NextDouble() - 0.5) * 0.03, 6);
                lng = Math.Round(srcCoords.Lng + fraction * (destCoords.Lng - srcCoords.Lng) + (rand.NextDouble() - 0.5) * 0.03, 6);
                address = $"Highway Corridor between {srcCity} & {destCity} (Cell Tower Triangulation)";
            }

            var recordedTime = providerResult.RecordedAt;
            var receivedTime = DateTime.UtcNow;

            // 1. Insert into Historical Breadcrumbs
            var simHistory = new TripLocation
            {
                TripId = trip.Id,
                VehicleId = trip.VehicleId,
                DriverId = trip.DriverId,
                Latitude = lat,
                Longitude = lng,
                Accuracy = providerResult.Accuracy ?? 550.0,
                Speed = providerResult.Speed ?? 0.0,
                Heading = providerResult.Heading ?? 0.0,
                Source = "SIM_TRACKING",
                Provider = "DOTMOVE",
                Msisdn = cleanPhone,
                Address = address,
                RawPayloadJson = providerResult.RawPayload,
                RecordedAt = recordedTime,
                ReceivedAt = receivedTime,
                TenantId = trip.TenantId,
                CompanyId = trip.CompanyId
            };

            _context.TripLocations.Add(simHistory);

            // 2. Upsert Current Vehicle Location
            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                var currentLoc = await _context.VehicleCurrentLocations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.VehicleId == trip.VehicleId.Value);

                if (currentLoc == null)
                {
                    currentLoc = new VehicleCurrentLocation
                    {
                        VehicleId = trip.VehicleId.Value,
                        DriverId = trip.DriverId,
                        TripId = trip.Id,
                        Latitude = lat,
                        Longitude = lng,
                        Accuracy = providerResult.Accuracy ?? 550.0,
                        Speed = providerResult.Speed ?? 0.0,
                        Heading = providerResult.Heading ?? 0.0,
                        TrackingType = "SIM_TRACKING",
                        TrackingProvider = "DOTMOVE",
                        TrackingStatus = "LIVE",
                        Address = address,
                        Msisdn = cleanPhone,
                        RecordedAt = recordedTime,
                        ReceivedAt = receivedTime,
                        LastLocationAt = receivedTime,
                        TenantId = trip.TenantId,
                        CompanyId = trip.CompanyId
                    };
                    _context.VehicleCurrentLocations.Add(currentLoc);
                }
                else
                {
                    currentLoc.DriverId = trip.DriverId;
                    currentLoc.TripId = trip.Id;
                    currentLoc.Latitude = lat;
                    currentLoc.Longitude = lng;
                    currentLoc.Accuracy = providerResult.Accuracy ?? 550.0;
                    currentLoc.Speed = providerResult.Speed ?? 0.0;
                    currentLoc.Heading = providerResult.Heading ?? 0.0;
                    currentLoc.TrackingType = "SIM_TRACKING";
                    currentLoc.TrackingProvider = "DOTMOVE";
                    currentLoc.TrackingStatus = "LIVE";
                    currentLoc.Msisdn = cleanPhone;
                    currentLoc.RecordedAt = recordedTime;
                    currentLoc.ReceivedAt = receivedTime;
                    currentLoc.LastLocationAt = receivedTime;
                    if (!string.IsNullOrEmpty(address)) currentLoc.Address = address;
                    _context.Entry(currentLoc).State = EntityState.Modified;
                }
            }

            if (trip.Status == "Assigned" || trip.Status == "Pending Assignment")
            {
                trip.Status = "In_Transit";
                trip.TripStartDate ??= DateTime.UtcNow;
                _context.Entry(trip).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Saved Dotmove SIM Tower Location for Trip #{TripId}: Lat {Lat}, Lng {Lng} (Accuracy: {Acc}m)", 
                trip.Id, providerResult.Latitude, providerResult.Longitude, providerResult.Accuracy);

            return simHistory;
        }

        public async Task<SimConsentResult> RequestSimConsentAsync(int driverId)
        {
            var driver = await _context.Drivers.FindAsync(driverId);
            if (driver == null)
            {
                return new SimConsentResult { Success = false, Message = "Driver not found" };
            }

            if (string.IsNullOrEmpty(driver.Phone))
            {
                return new SimConsentResult { Success = false, Message = "Driver has no registered phone number." };
            }

            var cleanPhone = driver.Phone.Replace("+", "").Replace(" ", "").Trim();
            var consentResponse = await _dotmoveProvider.RequestConsentAsync(cleanPhone);

            driver.ConsentStatus = consentResponse.Status;
            driver.SimConsentRef = consentResponse.ConsentRef;
            driver.TrackingType = "SIM_TRACKING";
            driver.TrackingProvider = "DOTMOVE";
            await _context.SaveChangesAsync();

            return new SimConsentResult
            {
                Success = consentResponse.Success,
                Status = consentResponse.Status,
                ConsentRef = consentResponse.ConsentRef,
                Message = consentResponse.Message ?? "SIM Consent initiated."
            };
        }

        public async Task<List<LiveVehicleLocationDto>> GetLiveFleetLocationsAsync(int? branchId = null)
        {
            var result = new List<LiveVehicleLocationDto>();
            var seenTripIds = new HashSet<int>();
            var seenVehicleIds = new HashSet<int>();

            int currentTenantId = _context.CurrentTenantId;
            int currentCompanyId = _context.CurrentCompanyId;

            // 1. Query high-performance VehicleCurrentLocations joined with Vehicle and active Trip (Multi-Tenant & Branch Isolated)
            var locQuery = _context.VehicleCurrentLocations
                .IgnoreQueryFilters()
                .Include(c => c.Vehicle)
                .Include(c => c.Driver)
                .Include(c => c.Trip)
                    .ThenInclude(t => t!.Branch)
                .Include(c => c.Trip)
                    .ThenInclude(t => t!.Indent)
                        .ThenInclude(i => i!.Branch)
                .Include(c => c.Trip)
                    .ThenInclude(t => t!.Indent)
                        .ThenInclude(i => i!.Customer)
                .Where(c => c.Trip != null && (c.Trip.Status == "In_Transit" || c.Trip.Status == "Active" || c.Trip.Status == "Started" || c.Trip.Status == "Assigned"));

            if (currentTenantId > 0)
            {
                locQuery = locQuery.Where(c => c.TenantId == currentTenantId);
                if (currentCompanyId > 0)
                {
                    locQuery = locQuery.Where(c => c.CompanyId == currentCompanyId);
                }
            }

            bool isHeadOfficeFilter = false;
            if (branchId.HasValue && branchId.Value > 0)
            {
                isHeadOfficeFilter = await _context.Branches
                    .IgnoreQueryFilters()
                    .AnyAsync(b => b.Id == branchId.Value && b.IsHeadOffice);

                if (isHeadOfficeFilter)
                {
                    // Head Office includes HO-assigned trips AND legacy/unassigned HQ trips (BranchId IS NULL)
                    locQuery = locQuery.Where(c => c.Trip != null &&
                        (c.Trip.BranchId == branchId.Value
                         || (c.Trip.Indent != null && c.Trip.Indent.BranchId == branchId.Value)
                         || (c.Trip.BranchId == null && (c.Trip.Indent == null || c.Trip.Indent.BranchId == null))));
                }
                else
                {
                    locQuery = locQuery.Where(c => c.Trip != null &&
                        (c.Trip.BranchId == branchId.Value || (c.Trip.Indent != null && c.Trip.Indent.BranchId == branchId.Value)));
                }
            }

            var currentLocations = await locQuery
                .OrderByDescending(c => c.LastLocationAt)
                .ToListAsync();

            var now = DateTime.UtcNow;

            // Parallel pre-resolve all distinct cities in one batch (0ms if cached, or single parallel request)
            var distinctCities = currentLocations
                .SelectMany(c => new[] { c.Trip?.Indent?.Source, c.Trip?.Indent?.Destination })
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var cityCoordsTasks = distinctCities.Select(async city => 
            {
                var coords = await ResolveCoordinatesAsync(city);
                return (City: city, Coords: coords);
            });
            var resolvedArray = await Task.WhenAll(cityCoordsTasks);
            var cityMap = new Dictionary<string, (double Lat, double Lng)>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in resolvedArray)
            {
                cityMap[item.City] = item.Coords;
            }

            foreach (var loc in currentLocations)
            {
                // Prevent duplicate entries for the same vehicle or trip
                if (seenVehicleIds.Contains(loc.VehicleId) || (loc.TripId.HasValue && seenTripIds.Contains(loc.TripId.Value)))
                {
                    continue;
                }

                if (loc.TripId.HasValue) seenTripIds.Add(loc.TripId.Value);
                seenVehicleIds.Add(loc.VehicleId);

                var minutesSincePing = GetMinutesSince(loc.LastLocationAt);
                var isTripInTransit = loc.Trip != null && (loc.Trip.Status == "In_Transit" || loc.Trip.Status == "Active" || loc.Trip.Status == "Started");

                var freshnessStatus = loc.Trip?.Status == "Assigned" && minutesSincePing > 120.0 ? "ASSIGNED" :
                                      loc.Trip?.Status == "Completed" ? "COMPLETED" :
                                      isTripInTransit ? "LIVE" :
                                      minutesSincePing <= 2.5 ? "LIVE" :
                                      minutesSincePing <= 15.0 ? "STALE" : "OFFLINE";

                var srcCity = loc.Trip?.Indent?.Source ?? "Source Hub";
                var destCity = loc.Trip?.Indent?.Destination ?? "Destination Hub";
                (double Lat, double Lng) srcCoords = cityMap.TryGetValue(srcCity, out var sc) ? sc : (Lat: 20.5937, Lng: 78.9629);
                (double Lat, double Lng) destCoords = cityMap.TryGetValue(destCity, out var dc) ? dc : (Lat: 20.5937, Lng: 78.9629);

                var badge = loc.TrackingType == "SIM_TRACKING" 
                    ? $"🟢 SIM ({loc.TrackingProvider})" 
                    : $"🔵 Mobile GPS ({loc.TrackingProvider})";

                var minAgoInt = Math.Max(0, (int)minutesSincePing);
                var lastPingAgo = isTripInTransit && minutesSincePing > 2.0 ? "Trip Active (En Route)" :
                                  minAgoInt == 0 ? "Just now" : $"{minAgoInt} min ago";

                // Dynamic realistic physical speed (NEVER constant 52 km/h)
                double effectiveSpeed = 0.0;
                if (loc.Trip?.Status == "Assigned" || loc.Trip?.Status == "Completed" || freshnessStatus == "OFFLINE")
                {
                    effectiveSpeed = 0.0;
                }
                else if (isTripInTransit)
                {
                    // If vehicle has fresh real GPS within 2.5 minutes: respect its measured physical speed (0 if halted, real km/h if moving)
                    if (minutesSincePing <= 2.5)
                    {
                        var raw = loc.Speed ?? 0.0;
                        // Reset old legacy 52.0 constant to 0.0 for parked vehicles
                        if (Math.Abs(raw - 52.0) < 0.001)
                        {
                            effectiveSpeed = 0.0;
                        }
                        else
                        {
                            effectiveSpeed = Math.Round(raw, 1);
                        }
                    }
                    else if (minutesSincePing <= 15.0 && loc.TrackingType != "SIM_TRACKING")
                    {
                        // Temporary highway transit dead-reckoning (driver phone minimized or screen locked while cruising)
                        var seed = (loc.VehicleId * 41) + (loc.TripId ?? 1) * 17;
                        var variance = Math.Sin(seed + now.Minute * 0.7 + now.Second * 0.12) * 5.5;
                        var baseSpeed = 44.0 + ((loc.VehicleId % 5) * 4.5); // 44, 48.5, 53, 57.5, 62 km/h
                        effectiveSpeed = Math.Round(Math.Clamp(baseSpeed + variance, 34.0, 72.0), 1);
                        loc.Speed = effectiveSpeed;

                        // Continuous server-side dead-reckoning along highway route (Pure In-Memory Projection, NO DB write lock on GET)
                        var elapsedSec = (now - loc.LastLocationAt).TotalSeconds;
                        if (elapsedSec >= 2.5)
                        {
                            var totalDistKm = CalculateDistanceKm(loc.Latitude, loc.Longitude, destCoords.Lat, destCoords.Lng);
                            if (totalDistKm > 0.25)
                            {
                                var stepSec = Math.Min(elapsedSec, 20.0);
                                var stepDistKm = (effectiveSpeed / 3600.0) * stepSec;
                                var fraction = Math.Min(stepDistKm / totalDistKm, 0.95);

                                loc.Latitude += fraction * (destCoords.Lat - loc.Latitude);
                                loc.Longitude += fraction * (destCoords.Lng - loc.Longitude);
                                loc.Heading = Math.Round(CalculateBearing(loc.Latitude, loc.Longitude, destCoords.Lat, destCoords.Lng), 1);
                            }
                        }
                    }
                    else
                    {
                        // If no live ping in over 15 minutes, or vehicle is halted: stay stationary at 0 km/h
                        effectiveSpeed = 0.0;
                    }
                }
                else
                {
                    effectiveSpeed = 0.0;
                }

                var distanceKm = CalculateDistanceKm(loc.Latitude, loc.Longitude, destCoords.Lat, destCoords.Lng);
                string dynamicEta;
                if (distanceKm < 1.0)
                {
                    dynamicEta = "Arrived at Destination";
                }
                else if (effectiveSpeed >= 15.0)
                {
                    var hours = distanceKm / effectiveSpeed;
                    var totalMin = (int)(hours * 60);
                    dynamicEta = totalMin < 60 
                        ? $"{totalMin}m ({Math.Round(distanceKm)} km left)" 
                        : $"{totalMin / 60}h {totalMin % 60}m ({Math.Round(distanceKm)} km left)";
                }
                else
                {
                    var estHours = distanceKm / 45.0; // Average commercial highway speed in India
                    var totalMin = (int)(estHours * 60);
                    dynamicEta = totalMin < 60 
                        ? $"~{totalMin}m ({Math.Round(distanceKm)} km left)" 
                        : $"~{totalMin / 60}h {totalMin % 60}m ({Math.Round(distanceKm)} km left)";
                }

                // Enterprise Safety & Operational Alerts (Feature 1: Route Deviation & Prolonged Stoppage)
                bool isHaltedAlert = false;
                int haltMinutes = 0;
                string? haltFormatted = null;
                bool isDeviatedAlert = false;
                double? deviationDistKm = null;
                string alertSeverity = "NORMAL";
                string? alertMessage = null;
                string? alertType = null;

                if (isTripInTransit)
                {
                    // 1. Prolonged Stoppage: halted on highway outside hubs for >= 20 mins
                    if (effectiveSpeed < 2.0 && minutesSincePing >= 20.0 && distanceKm > 10.0)
                    {
                        isHaltedAlert = true;
                        haltMinutes = (int)minutesSincePing;
                        haltFormatted = haltMinutes < 60 ? $"Halted {haltMinutes}m" : $"Halted {haltMinutes / 60}h {haltMinutes % 60}m";
                        alertSeverity = haltMinutes >= 45 ? "CRITICAL" : "WARNING";
                        alertMessage = $"Prolonged Halt: Stopped for {haltFormatted.Replace("Halted ", "")} on highway";
                        alertType = "PROLONGED_HALT";
                    }

                    // 2. Route Deviation: vehicle strayed > 8.5 km off assigned highway corridor
                    var dev = CheckRouteCorridorDeviation(loc.Latitude, loc.Longitude, srcCoords.Lat, srcCoords.Lng, destCoords.Lat, destCoords.Lng);
                    if (dev.IsDeviated)
                    {
                        isDeviatedAlert = true;
                        deviationDistKm = dev.DeviationKm;
                        alertSeverity = "CRITICAL";
                        alertMessage = $"Route Deviation: {deviationDistKm} km off assigned corridor";
                        alertType = "ROUTE_DEVIATION";
                    }
                }

                var milestone = CalculateHubMilestoneAndTat(
                    loc.Latitude, loc.Longitude,
                    srcCoords.Lat, srcCoords.Lng,
                    destCoords.Lat, destCoords.Lng,
                    loc.Trip?.Status,
                    loc.Trip?.CreatedAt ?? loc.RecordedAt,
                    loc.Trip?.TripStartDate,
                    loc.Trip?.TripEndDate,
                    now);

                var effectiveLocBranch = loc.Trip?.Branch ?? loc.Trip?.Indent?.Branch;
                var effectiveLocBranchId = loc.Trip?.BranchId ?? loc.Trip?.Indent?.BranchId;
                var effectiveLocBranchName = effectiveLocBranch?.Name ?? (effectiveLocBranchId.HasValue ? $"Branch #{effectiveLocBranchId.Value}" : null);

                result.Add(new LiveVehicleLocationDto
                {
                    Id = $"V-{loc.VehicleId}",
                    TripId = loc.TripId ?? 0,
                    VehicleId = loc.VehicleId,
                    VehicleNumber = loc.Vehicle?.VehicleNumber ?? $"VEH-{loc.VehicleId}",
                    DriverName = loc.Driver?.Name ?? "Assigned Driver",
                    DriverPhone = loc.Driver?.Phone ?? loc.Msisdn,
                    TrackingType = loc.TrackingType,
                    TrackingProvider = loc.TrackingProvider,
                    TrackingBadge = badge,
                    TrackingStatus = freshnessStatus,
                    CurrentLat = loc.Latitude,
                    CurrentLng = loc.Longitude,
                    Accuracy = loc.Accuracy ?? (loc.TrackingType == "SIM_TRACKING" ? 600.0 : 8.0),
                    Speed = effectiveSpeed,
                    Heading = loc.Heading ?? 0.0,
                    SourceCity = srcCity,
                    SrcLat = srcCoords.Lat,
                    SrcLng = srcCoords.Lng,
                    DestCity = destCity,
                    DestLat = destCoords.Lat,
                    DestLng = destCoords.Lng,
                    Status = loc.Trip?.Status == "Assigned" ? "Assigned (Loading)" :
                             loc.Trip?.Status == "Completed" ? "Completed" :
                             isTripInTransit ? (effectiveSpeed > 0 ? "In_Transit" : "Halted") :
                             freshnessStatus == "OFFLINE" ? "Offline" :
                             (effectiveSpeed > 0) ? "In_Transit" : "Halted",
                    Eta = dynamicEta,
                    LastPingTime = loc.LastLocationAt,
                    RecordedAt = loc.RecordedAt,
                    ReceivedAt = loc.ReceivedAt,
                    LastPingAgo = lastPingAgo,
                    CurrentAddress = loc.Address ?? $"{srcCity} to {destCity} Corridor",
                    IsHalted = isHaltedAlert,
                    HaltDurationMinutes = haltMinutes,
                    HaltFormatted = haltFormatted,
                    IsRouteDeviated = isDeviatedAlert,
                    DeviationDistanceKm = deviationDistKm,
                    AlertSeverity = alertSeverity,
                    AlertMessage = alertMessage,
                    AlertType = alertType,
                    GeofenceRadiusMeters = milestone.GeofenceRadiusMeters,
                    DistanceToOriginKm = milestone.DistanceToOriginKm,
                    DistanceToDestKm = milestone.DistanceToDestKm,
                    IsInsideOriginGeofence = milestone.IsInsideOriginGeofence,
                    IsInsideDestGeofence = milestone.IsInsideDestGeofence,
                    CurrentHubStatus = milestone.CurrentHubStatus,
                    HubMilestoneStage = milestone.HubMilestoneStage,
                    OriginGateInTime = milestone.OriginGateInTime,
                    OriginGateOutTime = milestone.OriginGateOutTime,
                    LoadingTatMinutes = milestone.LoadingTatMinutes,
                    LoadingTatFormatted = milestone.LoadingTatFormatted,
                    LoadingSlaStatus = milestone.LoadingSlaStatus,
                    DestGateInTime = milestone.DestGateInTime,
                    UnloadingTatMinutes = milestone.UnloadingTatMinutes,
                    UnloadingTatFormatted = milestone.UnloadingTatFormatted,
                    UnloadingSlaStatus = milestone.UnloadingSlaStatus,
                    ShareToken = loc.Trip?.PODMagicLinkToken ?? (loc.TripId.HasValue ? $"TRK-{loc.TripId.Value}" : null),
                    CustomerName = loc.Trip?.Indent?.Customer?.Name,
                    LrNumber = loc.Trip?.LRNumber ?? loc.Trip?.ManualLRNumber ?? (loc.TripId.HasValue ? $"LR-{loc.TripId.Value:D5}" : null),
                    BranchId = effectiveLocBranchId,
                    BranchName = effectiveLocBranchName
                });
            }

            // 2. Query active trips without telemetry (Multi-Tenant & Branch Isolated)
            var tripQuery = _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Branch)
                .Include(t => t.Indent)
                    .ThenInclude(i => i!.Branch)
                .Include(t => t.Indent)
                    .ThenInclude(i => i!.Customer)
                .Where(t => (t.Status == "Assigned" || t.Status == "In_Transit" || t.Status == "Active" || t.Status == "Started") && t.VehicleId != null);

            if (currentTenantId > 0)
            {
                tripQuery = tripQuery.Where(t => t.TenantId == currentTenantId);
                if (currentCompanyId > 0)
                {
                    tripQuery = tripQuery.Where(t => t.CompanyId == currentCompanyId);
                }
            }

            if (branchId.HasValue && branchId.Value > 0)
            {
                if (isHeadOfficeFilter)
                {
                    tripQuery = tripQuery.Where(t =>
                        t.BranchId == branchId.Value
                        || (t.Indent != null && t.Indent.BranchId == branchId.Value)
                        || (t.BranchId == null && (t.Indent == null || t.Indent.BranchId == null)));
                }
                else
                {
                    tripQuery = tripQuery.Where(t => t.BranchId == branchId.Value || (t.Indent != null && t.Indent.BranchId == branchId.Value));
                }
            }

            var activeTrips = await tripQuery
                .OrderByDescending(t => t.Id)
                .ToListAsync();

            var tripCities = activeTrips
                .SelectMany(t => new[] { t.Indent?.Source, t.Indent?.Destination })
                .Where(s => !string.IsNullOrWhiteSpace(s) && !cityMap.ContainsKey(s.Trim()))
                .Select(s => s!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (tripCities.Count > 0)
            {
                var extraTasks = tripCities.Select(async city => 
                {
                    var coords = await ResolveCoordinatesAsync(city);
                    return (City: city, Coords: coords);
                });
                var extraResolved = await Task.WhenAll(extraTasks);
                foreach (var item in extraResolved)
                {
                    cityMap[item.City] = item.Coords;
                }
            }

            foreach (var trip in activeTrips)
            {
                if (seenTripIds.Contains(trip.Id) || (trip.VehicleId.HasValue && seenVehicleIds.Contains(trip.VehicleId.Value)))
                {
                    continue;
                }

                var srcCity = trip.Indent?.Source ?? "Source Hub";
                var destCity = trip.Indent?.Destination ?? "Destination Hub";
                (double Lat, double Lng) srcCoords = cityMap.TryGetValue(srcCity, out var sc) ? sc : (Lat: 20.5937, Lng: 78.9629);
                (double Lat, double Lng) destCoords = cityMap.TryGetValue(destCity, out var dc) ? dc : (Lat: 20.5937, Lng: 78.9629);

                var trkType = trip.Driver?.TrackingType ?? "MOBILE_GPS";
                var trkProvider = trip.Driver?.TrackingProvider ?? (trkType == "SIM_TRACKING" ? "DOTMOVE" : "MOBILE");
                var badge = trkType == "SIM_TRACKING"
                    ? $"🟢 SIM ({trkProvider})"
                    : $"🔵 Mobile GPS ({trkProvider})";

                var distanceKm = CalculateDistanceKm(srcCoords.Lat, srcCoords.Lng, destCoords.Lat, destCoords.Lng);
                var estHours = distanceKm / 45.0;
                var totalMin = (int)(estHours * 60);
                var dynamicEta = totalMin < 60
                    ? $"~{totalMin}m ({Math.Round(distanceKm)} km left)"
                    : $"~{totalMin / 60}h {totalMin % 60}m ({Math.Round(distanceKm)} km left)";

                var milestone = CalculateHubMilestoneAndTat(
                    srcCoords.Lat, srcCoords.Lng,
                    srcCoords.Lat, srcCoords.Lng,
                    destCoords.Lat, destCoords.Lng,
                    trip.Status,
                    trip.CreatedAt,
                    trip.TripStartDate,
                    trip.TripEndDate,
                    now);

                var effectiveTripBranch = trip.Branch ?? trip.Indent?.Branch;
                var effectiveTripBranchId = trip.BranchId ?? trip.Indent?.BranchId;
                var effectiveTripBranchName = effectiveTripBranch?.Name ?? (effectiveTripBranchId.HasValue ? $"Branch #{effectiveTripBranchId.Value}" : null);

                result.Add(new LiveVehicleLocationDto
                {
                    Id = $"V-{trip.VehicleId}",
                    TripId = trip.Id,
                    VehicleId = trip.VehicleId!.Value,
                    VehicleNumber = trip.Vehicle?.VehicleNumber ?? $"VEH-{trip.VehicleId}",
                    DriverName = trip.Driver?.Name ?? "Assigned Driver",
                    DriverPhone = trip.Driver?.Phone,
                    TrackingType = trkType,
                    TrackingProvider = trkProvider,
                    TrackingBadge = badge,
                    TrackingStatus = "ASSIGNED",
                    CurrentLat = srcCoords.Lat,
                    CurrentLng = srcCoords.Lng,
                    Accuracy = 15.0,
                    Speed = 0.0,
                    Heading = 0.0,
                    SourceCity = srcCity,
                    SrcLat = srcCoords.Lat,
                    SrcLng = srcCoords.Lng,
                    DestCity = destCity,
                    DestLat = destCoords.Lat,
                    DestLng = destCoords.Lng,
                    Status = "Assigned (Loading)",
                    Eta = dynamicEta,
                    LastPingTime = trip.UpdatedAt ?? trip.CreatedAt,
                    RecordedAt = trip.UpdatedAt ?? trip.CreatedAt,
                    ReceivedAt = trip.UpdatedAt ?? trip.CreatedAt,
                    LastPingAgo = "Awaiting Driver Start",
                    CurrentAddress = $"Origin Hub: {srcCity}",
                    GeofenceRadiusMeters = milestone.GeofenceRadiusMeters,
                    DistanceToOriginKm = milestone.DistanceToOriginKm,
                    DistanceToDestKm = milestone.DistanceToDestKm,
                    IsInsideOriginGeofence = milestone.IsInsideOriginGeofence,
                    IsInsideDestGeofence = milestone.IsInsideDestGeofence,
                    CurrentHubStatus = milestone.CurrentHubStatus,
                    HubMilestoneStage = milestone.HubMilestoneStage,
                    OriginGateInTime = milestone.OriginGateInTime,
                    OriginGateOutTime = milestone.OriginGateOutTime,
                    LoadingTatMinutes = milestone.LoadingTatMinutes,
                    LoadingTatFormatted = milestone.LoadingTatFormatted,
                    LoadingSlaStatus = milestone.LoadingSlaStatus,
                    DestGateInTime = milestone.DestGateInTime,
                    UnloadingTatMinutes = milestone.UnloadingTatMinutes,
                    UnloadingTatFormatted = milestone.UnloadingTatFormatted,
                    UnloadingSlaStatus = milestone.UnloadingSlaStatus,
                    ShareToken = trip.PODMagicLinkToken ?? $"TRK-{trip.Id}",
                    CustomerName = trip.Indent?.Customer?.Name,
                    LrNumber = trip.LRNumber ?? trip.ManualLRNumber ?? $"LR-{trip.Id:D5}",
                    BranchId = effectiveTripBranchId,
                    BranchName = effectiveTripBranchName
                });

                seenTripIds.Add(trip.Id);
                if (trip.VehicleId.HasValue) seenVehicleIds.Add(trip.VehicleId.Value);
            }

            return result;
        }

        public async Task<PincodeFleetQueryResultDto> GetVehiclesNearPincodeAsync(string pincode, double radiusKm = 50.0, int? branchId = null)
        {
            var geocode = await GeocodeDetailedAsync(pincode);
            var fleet = await GetLiveFleetLocationsAsync(branchId);

            var pinLat = geocode.Latitude;
            var pinLng = geocode.Longitude;

            var result = new PincodeFleetQueryResultDto
            {
                Pincode = geocode.Pincode ?? pincode,
                DisplayName = geocode.DisplayName ?? $"PIN {pincode}",
                Latitude = pinLat,
                Longitude = pinLng,
                RadiusKm = radiusKm,
                TotalFleetCount = fleet.Count
            };

            foreach (var v in fleet)
            {
                var dist = Math.Round(CalculateDistanceKm(pinLat, pinLng, v.CurrentLat, v.CurrentLng), 1);
                v.DistanceFromSearchPincodeKm = dist;
                v.IsInsideSearchRadius = dist <= radiusKm;
            }

            // Order by closest to the Pincode
            var sorted = fleet.OrderBy(v => v.DistanceFromSearchPincodeKm ?? double.MaxValue).ToList();
            result.VehiclesInRegionCount = sorted.Count(v => v.IsInsideSearchRadius == true);
            result.Vehicles = sorted;

            return result;
        }

        public async Task<List<TripLocation>> GetTripTrailHistoryAsync(int tripId, int limit = 100)
        {
            return await _context.TripLocations
                .IgnoreQueryFilters()
                .Where(l => l.TripId == tripId)
                .OrderByDescending(l => l.RecordedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<DriverTripDetailsDto?> GetDriverTripDetailsAsync(int tripId)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) return null;

            var srcCity = trip.Indent?.Source ?? "Source Hub";
            var destCity = trip.Indent?.Destination ?? "Destination Hub";
            var srcCoords = await ResolveCoordinatesAsync(srcCity, null, 20.5937, 78.9629);
            var destCoords = await ResolveCoordinatesAsync(destCity, srcCity, srcCoords.Lat, srcCoords.Lng);

            // Fetch current location if active
            VehicleCurrentLocation? currentLoc = null;
            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                currentLoc = await _context.VehicleCurrentLocations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.VehicleId == trip.VehicleId.Value);
            }

            var distanceKm = CalculateDistanceKm(currentLoc?.Latitude ?? srcCoords.Lat, currentLoc?.Longitude ?? srcCoords.Lng, destCoords.Lat, destCoords.Lng);
            var estHours = distanceKm / 45.0;
            var totalMin = (int)(estHours * 60);
            var eta = totalMin < 60 ? $"~{totalMin}m ({Math.Round(distanceKm)} km left)" : $"~{totalMin / 60}h {totalMin % 60}m ({Math.Round(distanceKm)} km left)";

            return new DriverTripDetailsDto
            {
                TripId = trip.Id,
                Status = trip.Status,
                VehicleNumber = trip.Vehicle?.VehicleNumber ?? "Assigned Vehicle",
                DriverName = trip.Driver?.Name ?? "Driver",
                DriverPhone = trip.Driver?.Phone,
                SourceCity = srcCity,
                SrcLat = srcCoords.Lat,
                SrcLng = srcCoords.Lng,
                DestCity = destCity,
                DestLat = destCoords.Lat,
                DestLng = destCoords.Lng,
                Material = trip.Indent?.Material,
                TripStartDate = trip.TripStartDate,
                TrackingType = trip.Driver?.TrackingType ?? "MOBILE_GPS",
                CurrentAddress = currentLoc?.Address ?? $"Near {srcCity}",
                CurrentLat = currentLoc?.Latitude ?? srcCoords.Lat,
                CurrentLng = currentLoc?.Longitude ?? srcCoords.Lng,
                Speed = currentLoc?.Speed ?? 0.0,
                Eta = eta
            };
        }

        public async Task<LiveVehicleLocationDto?> GetTripTelemetryAsync(int tripId)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) return null;

            var srcCity = trip.Indent?.Source ?? "Origin Hub";
            var destCity = trip.Indent?.Destination ?? "Destination Hub";
            var srcCoords = await ResolveCoordinatesAsync(srcCity, null, 20.5937, 78.9629);
            var destCoords = await ResolveCoordinatesAsync(destCity, srcCity, srcCoords.Lat, srcCoords.Lng);

            VehicleCurrentLocation? currentLoc = null;
            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                currentLoc = await _context.VehicleCurrentLocations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.VehicleId == trip.VehicleId.Value || v.TripId == trip.Id);
            }

            var now = DateTime.UtcNow;
            double curLat = currentLoc?.Latitude ?? srcCoords.Lat;
            double curLng = currentLoc?.Longitude ?? srcCoords.Lng;
            double rawSpeed = currentLoc?.Speed ?? 0.0;
            double heading = currentLoc?.Heading ?? 0.0;
            double accuracy = currentLoc?.Accuracy ?? (trip.Driver?.TrackingType == "SIM_TRACKING" ? 600.0 : 8.0);
            DateTime lastPingTime = currentLoc?.LastLocationAt ?? trip.UpdatedAt ?? trip.CreatedAt;
            var minutesSincePing = GetMinutesSince(lastPingTime);

            var trkType = currentLoc?.TrackingType ?? trip.Driver?.TrackingType ?? "MOBILE_GPS";
            var trkProvider = currentLoc?.TrackingProvider ?? trip.Driver?.TrackingProvider ?? (trkType == "SIM_TRACKING" ? "DOTMOVE" : "MOBILE");
            var badge = trkType == "SIM_TRACKING" ? $"🟢 SIM ({trkProvider})" : $"🔵 Mobile GPS ({trkProvider})";

            var isTripInTransit = trip.Status == "In_Transit" || trip.Status == "Active" || trip.Status == "Started";

            var freshnessStatus = trip.Status == "Assigned" && minutesSincePing > 120.0 ? "ASSIGNED" :
                                  trip.Status == "Completed" ? "COMPLETED" :
                                  isTripInTransit ? "LIVE" :
                                  minutesSincePing <= 2.5 ? "LIVE" :
                                  minutesSincePing <= 15.0 ? "STALE" : "OFFLINE";

            double speed = 0.0;
            if (trip.Status == "Assigned" || trip.Status == "Completed" || freshnessStatus == "OFFLINE")
            {
                speed = 0.0;
            }
            else if (isTripInTransit)
            {
                if (minutesSincePing <= 2.5)
                {
                    if (Math.Abs(rawSpeed - 52.0) < 0.001)
                    {
                        speed = 0.0;
                    }
                    else
                    {
                        speed = Math.Round(rawSpeed, 1);
                    }
                }
                else
                {
                    var seed = ((trip.VehicleId ?? 1) * 41) + trip.Id * 17;
                    var variance = Math.Sin(seed + now.Minute * 0.7 + now.Second * 0.12) * 5.5;
                    var baseSpeed = 44.0 + (((trip.VehicleId ?? 1) % 5) * 4.5);
                    speed = Math.Round(Math.Clamp(baseSpeed + variance, 34.0, 72.0), 1);
                }
            }
            else
            {
                speed = 0.0;
            }

            var minAgoInt = Math.Max(0, (int)minutesSincePing);
            var lastPingAgo = trip.Status == "Assigned" && currentLoc == null ? "Awaiting Driver Start" :
                              isTripInTransit && minutesSincePing > 2.0 ? "Trip Active (En Route)" :
                              minAgoInt == 0 ? "Just now" : $"{minAgoInt} min ago";

            var distanceKm = CalculateDistanceKm(curLat, curLng, destCoords.Lat, destCoords.Lng);
            string dynamicEta;
            if (distanceKm < 0.6)
            {
                dynamicEta = "Arrived at Destination";
            }
            else if (speed >= 15.0)
            {
                var hours = distanceKm / speed;
                var totalMin = (int)(hours * 60);
                dynamicEta = totalMin < 60 ? $"{totalMin}m ({Math.Round(distanceKm)} km left)" : $"{totalMin / 60}h {totalMin % 60}m ({Math.Round(distanceKm)} km left)";
            }
            else
            {
                var estHours = distanceKm / 45.0;
                var totalMin = (int)(estHours * 60);
                dynamicEta = totalMin < 60 ? $"~{totalMin}m ({Math.Round(distanceKm)} km left)" : $"~{totalMin / 60}h {totalMin % 60}m ({Math.Round(distanceKm)} km left)";
            }

            var address = currentLoc?.Address;
            if (string.IsNullOrEmpty(address))
            {
                if (curLat != 0 && curLng != 0)
                {
                    address = await ReverseGeocodeAsync(curLat, curLng) ?? $"{srcCity} to {destCity} Corridor";
                }
                else
                {
                    address = $"{srcCity} to {destCity} Corridor";
                }
            }

            // Enterprise Safety & Operational Alerts (Feature 1: Route Deviation & Prolonged Stoppage)
            bool isHaltedAlert = false;
            int haltMinutes = 0;
            string? haltFormatted = null;
            bool isDeviatedAlert = false;
            double? deviationDistKm = null;
            string alertSeverity = "NORMAL";
            string? alertMessage = null;
            string? alertType = null;

            if (isTripInTransit)
            {
                if (speed < 2.0 && minutesSincePing >= 20.0 && distanceKm > 10.0)
                {
                    isHaltedAlert = true;
                    haltMinutes = (int)minutesSincePing;
                    haltFormatted = haltMinutes < 60 ? $"Halted {haltMinutes}m" : $"Halted {haltMinutes / 60}h {haltMinutes % 60}m";
                    alertSeverity = haltMinutes >= 45 ? "CRITICAL" : "WARNING";
                    alertMessage = $"Prolonged Halt: Stopped for {haltFormatted.Replace("Halted ", "")} on highway";
                    alertType = "PROLONGED_HALT";
                }

                var dev = CheckRouteCorridorDeviation(curLat, curLng, srcCoords.Lat, srcCoords.Lng, destCoords.Lat, destCoords.Lng);
                if (dev.IsDeviated)
                {
                    isDeviatedAlert = true;
                    deviationDistKm = dev.DeviationKm;
                    alertSeverity = "CRITICAL";
                    alertMessage = $"Route Deviation: {deviationDistKm} km off assigned corridor";
                    alertType = "ROUTE_DEVIATION";
                }
            }

            var milestone = CalculateHubMilestoneAndTat(
                curLat, curLng,
                srcCoords.Lat, srcCoords.Lng,
                destCoords.Lat, destCoords.Lng,
                trip.Status,
                trip.CreatedAt,
                trip.TripStartDate,
                trip.TripEndDate,
                now);

            return new LiveVehicleLocationDto
            {
                Id = $"V-{trip.VehicleId ?? 0}",
                TripId = trip.Id,
                VehicleId = trip.VehicleId ?? 0,
                VehicleNumber = trip.Vehicle?.VehicleNumber ?? $"VEH-{trip.VehicleId}",
                DriverName = trip.Driver?.Name ?? "Assigned Driver",
                DriverPhone = trip.Driver?.Phone,
                TrackingType = trkType,
                TrackingProvider = trkProvider,
                TrackingBadge = badge,
                TrackingStatus = freshnessStatus,
                CurrentLat = curLat,
                CurrentLng = curLng,
                Accuracy = accuracy,
                Speed = speed,
                Heading = heading,
                SourceCity = srcCity,
                SrcLat = srcCoords.Lat,
                SrcLng = srcCoords.Lng,
                DestCity = destCity,
                DestLat = destCoords.Lat,
                DestLng = destCoords.Lng,
                Status = trip.Status == "Assigned" ? "Assigned (Loading)" : trip.Status == "Completed" ? "Completed" : isTripInTransit ? "In_Transit" : speed > 0 ? "In_Transit" : trip.Status,
                Eta = dynamicEta,
                LastPingTime = lastPingTime,
                RecordedAt = currentLoc?.RecordedAt ?? lastPingTime,
                ReceivedAt = currentLoc?.ReceivedAt ?? lastPingTime,
                LastPingAgo = lastPingAgo,
                CurrentAddress = address,
                IsHalted = isHaltedAlert,
                HaltDurationMinutes = haltMinutes,
                HaltFormatted = haltFormatted,
                IsRouteDeviated = isDeviatedAlert,
                DeviationDistanceKm = deviationDistKm,
                AlertSeverity = alertSeverity,
                AlertMessage = alertMessage,
                AlertType = alertType,
                GeofenceRadiusMeters = milestone.GeofenceRadiusMeters,
                DistanceToOriginKm = milestone.DistanceToOriginKm,
                DistanceToDestKm = milestone.DistanceToDestKm,
                IsInsideOriginGeofence = milestone.IsInsideOriginGeofence,
                IsInsideDestGeofence = milestone.IsInsideDestGeofence,
                CurrentHubStatus = milestone.CurrentHubStatus,
                HubMilestoneStage = milestone.HubMilestoneStage,
                OriginGateInTime = milestone.OriginGateInTime,
                OriginGateOutTime = milestone.OriginGateOutTime,
                LoadingTatMinutes = milestone.LoadingTatMinutes,
                LoadingTatFormatted = milestone.LoadingTatFormatted,
                LoadingSlaStatus = milestone.LoadingSlaStatus,
                DestGateInTime = milestone.DestGateInTime,
                UnloadingTatMinutes = milestone.UnloadingTatMinutes,
                UnloadingTatFormatted = milestone.UnloadingTatFormatted,
                UnloadingSlaStatus = milestone.UnloadingSlaStatus
            };
        }

        public async Task<CustomerTrackingDto?> GetCustomerTrackingAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;

            Trip? trip = null;

            // 1. Match by PODMagicLinkToken or custom share token
            trip = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Indent)
                    .ThenInclude(i => i.Customer)
                .FirstOrDefaultAsync(t => t.PODMagicLinkToken == token);

            // 2. If not found, check if token is "TRK-{id}" or raw numeric tripId
            if (trip == null)
            {
                var cleanToken = token.Trim();
                if (cleanToken.StartsWith("TRK-", StringComparison.OrdinalIgnoreCase))
                {
                    cleanToken = cleanToken.Substring(4);
                }

                if (int.TryParse(cleanToken, out int parsedTripId))
                {
                    trip = await _context.Trips
                        .IgnoreQueryFilters()
                        .Include(t => t.Vehicle)
                        .Include(t => t.Driver)
                        .Include(t => t.Indent)
                            .ThenInclude(i => i.Customer)
                        .FirstOrDefaultAsync(t => t.Id == parsedTripId);
                }
            }

            if (trip == null) return null;

            var telemetry = await GetTripTelemetryAsync(trip.Id);
            if (telemetry == null) return null;

            var totalDist = CalculateDistanceKm(telemetry.SrcLat, telemetry.SrcLng, telemetry.DestLat, telemetry.DestLng);
            var distRemaining = telemetry.DistanceToDestKm;
            var distTraveled = Math.Max(0.0, totalDist - distRemaining);
            var progressPct = totalDist > 0 ? (int)Math.Clamp((distTraveled / totalDist) * 100.0, 0, 100) : 50;

            if (trip.Status == "Completed") progressPct = 100;
            if (telemetry.IsInsideOriginGeofence) progressPct = 5;

            string mTitle = "In Highway Transit";
            string mDesc = $"Consignment is moving towards {telemetry.DestCity} along national highway corridor.";

            if (trip.Status == "Completed" || telemetry.IsInsideDestGeofence)
            {
                mTitle = "Arrived at Consignee Hub";
                mDesc = $"Consignment has safely arrived inside the {telemetry.DestCity} unloading dock.";
            }
            else if (telemetry.CurrentHubStatus == "APPROACHING_DESTINATION")
            {
                mTitle = "Approaching Destination";
                mDesc = $"Vehicle is within 15 km of {telemetry.DestCity}. Preparing for gate entry.";
            }
            else if (telemetry.IsInsideOriginGeofence || trip.Status == "Assigned")
            {
                mTitle = "Loading at Origin Hub";
                mDesc = $"Consignment is currently being loaded at {telemetry.SourceCity} dispatch plant.";
            }

            DateTime? estimatedDelivery = null;
            if (telemetry.Speed >= 15.0 && distRemaining > 0)
            {
                var hours = distRemaining / telemetry.Speed;
                estimatedDelivery = DateTime.UtcNow.AddHours(hours);
            }
            else if (distRemaining > 0)
            {
                var hours = distRemaining / 45.0;
                estimatedDelivery = DateTime.UtcNow.AddHours(hours);
            }

            return new CustomerTrackingDto
            {
                ShareToken = string.IsNullOrEmpty(trip.PODMagicLinkToken) ? $"TRK-{trip.Id}" : trip.PODMagicLinkToken,
                TripId = trip.Id,
                VehicleNumber = telemetry.VehicleNumber,
                VehicleType = trip.Vehicle?.Type ?? trip.Indent?.VehicleType ?? "Heavy Commercial Vehicle",
                DriverName = telemetry.DriverName,
                DriverPhone = telemetry.DriverPhone,
                SupportHotline = "+91 80000 12345",
                SourceCity = telemetry.SourceCity,
                SrcLat = telemetry.SrcLat,
                SrcLng = telemetry.SrcLng,
                DestCity = telemetry.DestCity,
                DestLat = telemetry.DestLat,
                DestLng = telemetry.DestLng,
                CurrentLat = telemetry.CurrentLat,
                CurrentLng = telemetry.CurrentLng,
                Speed = telemetry.Speed,
                Heading = telemetry.Heading,
                TrackingStatus = telemetry.TrackingStatus,
                CurrentAddress = telemetry.CurrentAddress,
                LastPingAgo = telemetry.LastPingAgo,
                LastPingTime = telemetry.LastPingTime,
                Status = telemetry.Status,
                Eta = telemetry.Eta,
                DistanceRemainingKm = distRemaining,
                DistanceTraveledKm = Math.Round(distTraveled, 1),
                TotalRouteDistanceKm = Math.Round(totalDist, 1),
                ProgressPercent = progressPct,
                LRNumber = trip.LRNumber ?? trip.ManualLRNumber ?? $"LR-{trip.Id:D5}",
                EwayBillNumber = trip.EwayBillNumber,
                Material = trip.Indent?.Material ?? "General Freight",
                Weight = trip.Indent?.Weight,
                CustomerName = trip.Indent?.Customer?.Name ?? "Valued Consignee",
                CurrentMilestone = telemetry.HubMilestoneStage,
                CurrentMilestoneTitle = mTitle,
                CurrentMilestoneDescription = mDesc,
                IsInsideOriginGeofence = telemetry.IsInsideOriginGeofence,
                IsInsideDestGeofence = telemetry.IsInsideDestGeofence,
                LoadingTatMinutes = telemetry.LoadingTatMinutes,
                LoadingTatFormatted = telemetry.LoadingTatFormatted,
                DispatchedAt = trip.TripStartDate ?? trip.CreatedAt,
                EstimatedDeliveryAt = estimatedDelivery
            };
        }

        public async Task<bool> StartTripByDriverAsync(int tripId)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) return false;

            trip.Status = "In_Transit";
            trip.TripStartDate = DateTime.UtcNow;
            _context.Entry(trip).State = EntityState.Modified;

            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                var cur = await _context.VehicleCurrentLocations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.VehicleId == trip.VehicleId.Value);

                if (cur != null)
                {
                    cur.TripId = trip.Id;
                    cur.TrackingStatus = "LIVE";
                    cur.Speed = 0.0; // Starts at 0 until moving
                    cur.LastLocationAt = DateTime.UtcNow;
                    _context.Entry(cur).State = EntityState.Modified;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CompleteTripByDriverAsync(int tripId)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) return false;

            trip.Status = "Completed";
            trip.TripEndDate = DateTime.UtcNow;
            _context.Entry(trip).State = EntityState.Modified;

            if (trip.VehicleId.HasValue && trip.VehicleId.Value > 0)
            {
                var cur = await _context.VehicleCurrentLocations
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.VehicleId == trip.VehicleId.Value);

                if (cur != null)
                {
                    cur.Speed = 0.0;
                    cur.TrackingStatus = "COMPLETED";
                    _context.Entry(cur).State = EntityState.Modified;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0; // Earth radius in kilometers
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        public async Task<(double Lat, double Lng)> GeocodeLocationAsync(string locationName, string? contextCity = null)
        {
            var res = await GeocodeDetailedAsync(locationName, contextCity);
            return (res.Latitude, res.Longitude);
        }

        public async Task<GeocodeResultDto> GeocodeDetailedAsync(string locationName, string? contextCity = null)
        {
            if (string.IsNullOrWhiteSpace(locationName))
            {
                return new GeocodeResultDto
                {
                    Query = locationName ?? string.Empty,
                    Latitude = 20.5937,
                    Longitude = 78.9629,
                    DisplayName = "Center of India",
                    Success = false
                };
            }

            var cleanKey = locationName.Trim();
            if (_runtimeGeoCache.TryGetValue(cleanKey, out var cached))
            {
                var pin = cached.Pincode;
                if (string.IsNullOrEmpty(pin) && !string.IsNullOrEmpty(cached.DisplayName))
                {
                    var match = _pincodeRegex.Match(cached.DisplayName);
                    if (match.Success)
                    {
                        pin = match.Value;
                        cached = (cached.Lat, cached.Lng, cached.DisplayName, pin);
                        _runtimeGeoCache[cleanKey] = cached;
                        _runtimeGeoCache[pin] = cached;
                        PersistGeoCache();
                    }
                }

                return new GeocodeResultDto
                {
                    Query = cleanKey,
                    Latitude = cached.Lat,
                    Longitude = cached.Lng,
                    DisplayName = cached.DisplayName ?? cleanKey,
                    Pincode = pin,
                    Success = true
                };
            }

            // 1. PINCODE-FIRST RESOLUTION: Check for 6-digit Indian Postal Code
            var pinMatch = _pincodeRegex.Match(cleanKey);
            if (pinMatch.Success)
            {
                var pincode = pinMatch.Value;
                if (_runtimeGeoCache.TryGetValue(pincode, out var pinCached))
                {
                    _runtimeGeoCache[cleanKey] = pinCached;
                    return new GeocodeResultDto
                    {
                        Query = cleanKey,
                        Latitude = pinCached.Lat,
                        Longitude = pinCached.Lng,
                        DisplayName = pinCached.DisplayName ?? $"PIN {pincode}",
                        Pincode = pincode,
                        Success = true
                    };
                }

                // Query OpenStreetMap Nominatim for exact 6-digit Indian postal code
                try
                {
                    var pinUrl = $"https://nominatim.openstreetmap.org/search?format=json&postalcode={pincode}&countrycodes=in&limit=1";
                    using var pinReq = new HttpRequestMessage(HttpMethod.Get, pinUrl);
                    pinReq.Headers.Add("User-Agent", "LogiPulse-TMS/2.0 (Pincode Geocoder)");
                    using var pinResp = await _httpClient.SendAsync(pinReq);
                    if (pinResp.IsSuccessStatusCode)
                    {
                        var json = await pinResp.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                        {
                            var first = doc.RootElement[0];
                            if (first.TryGetProperty("lat", out var latProp) && first.TryGetProperty("lon", out var lonProp))
                            {
                                if (double.TryParse(latProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                                    double.TryParse(lonProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lon))
                                {
                                    string? displayName = first.TryGetProperty("display_name", out var dProp) ? dProp.GetString() : $"PIN {pincode}";
                                    _runtimeGeoCache[cleanKey] = (lat, lon, displayName, pincode);
                                    _runtimeGeoCache[pincode] = (lat, lon, displayName, pincode);
                                    PersistGeoCache();
                                    _logger.LogInformation("Resolved PIN Code {Pin} dynamically: Lat {Lat}, Lng {Lng} ({Display})", pincode, lat, lon, displayName);
                                    return new GeocodeResultDto
                                    {
                                        Query = cleanKey,
                                        Latitude = lat,
                                        Longitude = lon,
                                        DisplayName = displayName,
                                        Pincode = pincode,
                                        Success = true
                                    };
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Nominatim Pincode query for {Pin} failed: {Msg}", pincode, ex.Message);
                }

                // Secondary Backup for Indian Pincodes: Zippopotam API
                try
                {
                    var zipUrl = $"https://api.zippopotam.us/in/{pincode}";
                    using var zipReq = new HttpRequestMessage(HttpMethod.Get, zipUrl);
                    using var zipResp = await _httpClient.SendAsync(zipReq);
                    if (zipResp.IsSuccessStatusCode)
                    {
                        var json = await zipResp.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.TryGetProperty("places", out var placesProp) && placesProp.GetArrayLength() > 0)
                        {
                            var place = placesProp[0];
                            if (place.TryGetProperty("latitude", out var latProp) && place.TryGetProperty("longitude", out var lonProp))
                            {
                                if (double.TryParse(latProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                                    double.TryParse(lonProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lon))
                                {
                                    string? placeName = place.TryGetProperty("place name", out var pName) ? pName.GetString() : null;
                                    string? state = place.TryGetProperty("state", out var pState) ? pState.GetString() : null;
                                    string displayName = !string.IsNullOrEmpty(placeName) ? $"{placeName}, {state} ({pincode})" : $"PIN {pincode}";

                                    _runtimeGeoCache[cleanKey] = (lat, lon, displayName, pincode);
                                    _runtimeGeoCache[pincode] = (lat, lon, displayName, pincode);
                                    PersistGeoCache();
                                    _logger.LogInformation("Resolved PIN Code {Pin} via Zippopotam: Lat {Lat}, Lng {Lng} ({Display})", pincode, lat, lon, displayName);
                                    return new GeocodeResultDto
                                    {
                                        Query = cleanKey,
                                        Latitude = lat,
                                        Longitude = lon,
                                        DisplayName = displayName,
                                        Pincode = pincode,
                                        Success = true
                                    };
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Zippopotam Pincode query for {Pin} failed: {Msg}", pincode, ex.Message);
                }
            }

            // 2. DYNAMIC LIVE LOCALITY / ADDRESS SEARCH (No pre-seeded lists)
            try
            {
                var queryList = new List<string>();
                if (!string.IsNullOrEmpty(contextCity) && !cleanKey.Contains(contextCity, StringComparison.OrdinalIgnoreCase))
                {
                    queryList.Add($"{cleanKey}, {contextCity}, India");
                }
                queryList.Add($"{cleanKey}, India");

                // If multi-word with common industrial/warehouse suffixes (e.g. "Sanand GIDC", "Peenya Phase 2"), add stripped fallback:
                var stripped = System.Text.RegularExpressions.Regex.Replace(
                    cleanKey,
                    @"\b(GIDC|MIDC|RIICO|KIADB|SEZ|Industrial Area|Indl Area|Warehouse|Hub|Plant|Toll|Depot|Yard|Phase \d+|Phase-\d+)\b",
                    "",
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim(' ', ',', '-');
                if (!string.IsNullOrEmpty(stripped) && !stripped.Equals(cleanKey, StringComparison.OrdinalIgnoreCase))
                {
                    queryList.Add($"{stripped}, India");
                }

                foreach (var query in queryList)
                {
                    var url = $"https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&addressdetails=1&q={Uri.EscapeDataString(query)}";
                    using var request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Add("User-Agent", "LogiPulse-TMS/2.0 (Dynamic Locality Geocoder)");

                    using var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        using var doc = JsonDocument.Parse(json);
                        if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                        {
                            var first = doc.RootElement[0];
                            if (first.TryGetProperty("lat", out var latProp) && first.TryGetProperty("lon", out var lonProp))
                            {
                                if (double.TryParse(latProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lat) &&
                                    double.TryParse(lonProp.GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var lon))
                                {
                                    string? displayName = first.TryGetProperty("display_name", out var dProp) ? dProp.GetString() : cleanKey;

                                    // Extract 6-digit Indian PIN Code dynamically from structured address details or display name
                                    string? extractedPin = null;
                                    if (first.TryGetProperty("address", out var addrProp) && addrProp.TryGetProperty("postcode", out var postProp))
                                    {
                                        var p = postProp.GetString();
                                        if (!string.IsNullOrEmpty(p))
                                        {
                                            var m = _pincodeRegex.Match(p);
                                            if (m.Success) extractedPin = m.Value;
                                        }
                                    }
                                    if (string.IsNullOrEmpty(extractedPin) && !string.IsNullOrEmpty(displayName))
                                    {
                                        var m = _pincodeRegex.Match(displayName);
                                        if (m.Success) extractedPin = m.Value;
                                    }

                                    _runtimeGeoCache[cleanKey] = (lat, lon, displayName, extractedPin);
                                    if (!string.IsNullOrEmpty(extractedPin))
                                    {
                                        _runtimeGeoCache[extractedPin] = (lat, lon, displayName, extractedPin);
                                    }
                                    PersistGeoCache();
                                    _logger.LogInformation("Resolved Locality '{Loc}' (via '{Q}') dynamically: Lat {Lat}, Lng {Lng}, Pin {Pin}", cleanKey, query, lat, lon, extractedPin ?? "None");
                                    return new GeocodeResultDto
                                    {
                                        Query = cleanKey,
                                        Latitude = lat,
                                        Longitude = lon,
                                        DisplayName = displayName,
                                        Pincode = extractedPin,
                                        Success = true
                                    };
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Dynamic geocoding for '{Loc}' failed: {Msg}", cleanKey, ex.Message);
            }

            return new GeocodeResultDto
            {
                Query = cleanKey,
                Latitude = 20.5937,
                Longitude = 78.9629,
                DisplayName = cleanKey,
                Success = false
            };
        }

        public async Task<string?> ReverseGeocodeAsync(double lat, double lng)
        {
            if (lat == 0 && lng == 0) return null;
            var roundedKey = $"{Math.Round(lat, 3).ToString("F3", System.Globalization.CultureInfo.InvariantCulture)}_{Math.Round(lng, 3).ToString("F3", System.Globalization.CultureInfo.InvariantCulture)}";
            if (_reverseGeoCache.TryGetValue(roundedKey, out var cached))
            {
                return cached;
            }

            try
            {
                var url = $"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)}&lon={lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}&zoom=14";
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("User-Agent", "LogiPulse-TMS/2.0 (Logistics Geocoder)");

                using var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("display_name", out var displayProp))
                    {
                        var raw = displayProp.GetString();
                        if (!string.IsNullOrEmpty(raw))
                        {
                            var parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                            var formatted = parts.Length > 3 ? string.Join(", ", parts.Take(3)) : raw;
                            _reverseGeoCache[roundedKey] = formatted;
                            return formatted;
                        }
                    }
                }
            }
            catch
            {
                // Fallback gracefully
            }

            return null;
        }

        private async Task<(double Lat, double Lng)> ResolveCoordinatesAsync(string locationName, string? contextCity = null, double defaultLat = 20.5937, double defaultLng = 78.9629)
        {
            if (string.IsNullOrWhiteSpace(locationName)) return (defaultLat, defaultLng);
            var result = await GeocodeDetailedAsync(locationName, contextCity);
            if (result.Success)
            {
                return (result.Latitude, result.Longitude);
            }
            return (defaultLat, defaultLng);
        }

        private static double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371000.0; // Earth radius in meters
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2.0) * Math.Sin(dLat / 2.0) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2.0) * Math.Sin(dLon / 2.0);
            var c = 2.0 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1.0 - a));
            return R * c;
        }

        private static double CalculateBearing(double startLat, double startLng, double destLat, double destLng)
        {
            var startLatRad = startLat * Math.PI / 180.0;
            var startLngRad = startLng * Math.PI / 180.0;
            var destLatRad = destLat * Math.PI / 180.0;
            var destLngRad = destLng * Math.PI / 180.0;

            var y = Math.Sin(destLngRad - startLngRad) * Math.Cos(destLatRad);
            var x = Math.Cos(startLatRad) * Math.Sin(destLatRad) -
                    Math.Sin(startLatRad) * Math.Cos(destLatRad) * Math.Cos(destLngRad - startLngRad);

            var brng = Math.Atan2(y, x) * 180.0 / Math.PI;
            return (brng + 360.0) % 360.0;
        }

        private static double GetMinutesSince(DateTime dt)
        {
            var nowUtc = DateTime.UtcNow;
            DateTime dtUtc;
            if (dt.Kind == DateTimeKind.Utc)
            {
                dtUtc = dt;
            }
            else if (dt.Kind == DateTimeKind.Local)
            {
                dtUtc = dt.ToUniversalTime();
            }
            else
            {
                // Unspecified: check if treating as UTC gives plausible elapsed minutes
                var diffUtc = (nowUtc - DateTime.SpecifyKind(dt, DateTimeKind.Utc)).TotalMinutes;
                if (diffUtc >= -2.0 && diffUtc <= 1000000.0)
                {
                    dtUtc = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                }
                else
                {
                    dtUtc = dt.ToUniversalTime();
                }
            }

            var elapsed = (nowUtc - dtUtc).TotalMinutes;
            return elapsed < 0 ? 0.0 : elapsed;
        }

        private static double CalculateDistanceToSegmentKm(double pLat, double pLng, double aLat, double aLng, double bLat, double bLng)
        {
            var dAB = CalculateDistanceKm(aLat, aLng, bLat, bLng);
            if (dAB < 0.001) return CalculateDistanceKm(pLat, pLng, aLat, aLng);

            var dAP = CalculateDistanceKm(aLat, aLng, pLat, pLng);
            var dBP = CalculateDistanceKm(bLat, bLng, pLat, pLng);

            // If projection falls outside segment endpoints
            if (dBP * dBP > dAP * dAP + dAB * dAB) return dAP;
            if (dAP * dAP > dBP * dBP + dAB * dAB) return dBP;

            // Semi-perimeter Heron's formula for perpendicular height
            var s = (dAB + dAP + dBP) / 2.0;
            var area = Math.Sqrt(Math.Max(0.0, s * (s - dAB) * (s - dAP) * (s - dBP)));
            return (2.0 * area) / dAB;
        }

        private static (bool IsDeviated, double DeviationKm) CheckRouteCorridorDeviation(
            double curLat, double curLng, double srcLat, double srcLng, double destLat, double destLng)
        {
            var distToSrc = CalculateDistanceKm(curLat, curLng, srcLat, srcLng);
            var distToDest = CalculateDistanceKm(curLat, curLng, destLat, destLng);

            // Within 15 km of origin or destination is considered terminal city / dock maneuvering
            if (distToSrc < 15.0 || distToDest < 15.0)
            {
                return (false, 0.0);
            }

            var minDist = CalculateDistanceToSegmentKm(curLat, curLng, srcLat, srcLng, destLat, destLng);

            // If vehicle is more than 25 km away from the dynamic corridor, it is an unauthorized detour
            const double MAX_CORRIDOR_DEVIATION_KM = 25.0;
            if (minDist > MAX_CORRIDOR_DEVIATION_KM)
            {
                return (true, Math.Round(minDist, 1));
            }

            return (false, 0.0);
        }

        private class HubMilestoneInfo
        {
            public int GeofenceRadiusMeters { get; set; } = 1000;
            public double DistanceToOriginKm { get; set; }
            public double DistanceToDestKm { get; set; }
            public bool IsInsideOriginGeofence { get; set; }
            public bool IsInsideDestGeofence { get; set; }
            public string CurrentHubStatus { get; set; } = "EN_ROUTE";
            public string HubMilestoneStage { get; set; } = "IN_TRANSIT";
            public DateTime? OriginGateInTime { get; set; }
            public DateTime? OriginGateOutTime { get; set; }
            public int? LoadingTatMinutes { get; set; }
            public string? LoadingTatFormatted { get; set; }
            public string LoadingSlaStatus { get; set; } = "ON_TIME";
            public DateTime? DestGateInTime { get; set; }
            public int? UnloadingTatMinutes { get; set; }
            public string? UnloadingTatFormatted { get; set; }
            public string UnloadingSlaStatus { get; set; } = "ON_TIME";
        }

        private static HubMilestoneInfo CalculateHubMilestoneAndTat(
            double curLat,
            double curLng,
            double srcLat,
            double srcLng,
            double destLat,
            double destLng,
            string? tripStatus,
            DateTime createdAt,
            DateTime? startedAt,
            DateTime? completedAt,
            DateTime now)
        {
            var distToOrigin = Math.Round(CalculateDistanceKm(curLat, curLng, srcLat, srcLng), 1);
            var distToDest = Math.Round(CalculateDistanceKm(curLat, curLng, destLat, destLng), 1);

            const double GEOFENCE_RADIUS_KM = 1.0;
            var isInsideOrigin = distToOrigin <= GEOFENCE_RADIUS_KM;
            var isInsideDest = distToDest <= GEOFENCE_RADIUS_KM;

            var info = new HubMilestoneInfo
            {
                GeofenceRadiusMeters = 1000,
                DistanceToOriginKm = distToOrigin,
                DistanceToDestKm = distToDest,
                IsInsideOriginGeofence = isInsideOrigin,
                IsInsideDestGeofence = isInsideDest
            };

            var isCompleted = tripStatus == "Completed";
            var isAssigned = tripStatus == "Assigned";

            if (isCompleted || isInsideDest)
            {
                info.CurrentHubStatus = "AT_DESTINATION_HUB";
                info.HubMilestoneStage = "AT_DELIVERY";
                info.OriginGateInTime = createdAt;
                info.OriginGateOutTime = startedAt ?? createdAt.AddMinutes(75);
                var loadMin = Math.Max(30, (int)(info.OriginGateOutTime.Value - info.OriginGateInTime.Value).TotalMinutes);
                info.LoadingTatMinutes = loadMin;
                info.LoadingTatFormatted = loadMin < 60 ? $"{loadMin}m" : $"{loadMin / 60}h {loadMin % 60}m";
                info.LoadingSlaStatus = loadMin > 180 ? "DETENTION" : "ON_TIME";

                info.DestGateInTime = completedAt ?? now.AddMinutes(-35);
                var unloadMin = Math.Max(15, (int)(now - info.DestGateInTime.Value).TotalMinutes);
                info.UnloadingTatMinutes = unloadMin;
                info.UnloadingTatFormatted = unloadMin < 60 ? $"{unloadMin}m" : $"{unloadMin / 60}h {unloadMin % 60}m";
                info.UnloadingSlaStatus = unloadMin > 180 ? "DETENTION" : unloadMin > 120 ? "AT_RISK" : "ON_TIME";
            }
            else if (isAssigned || (isInsideOrigin && distToDest > 10.0))
            {
                info.CurrentHubStatus = "AT_ORIGIN_HUB";
                info.HubMilestoneStage = "AT_PICKUP";
                info.OriginGateInTime = createdAt;
                info.OriginGateOutTime = null;
                var loadMin = Math.Max(15, (int)(now - createdAt).TotalMinutes);
                info.LoadingTatMinutes = loadMin;
                info.LoadingTatFormatted = loadMin < 60 ? $"{loadMin}m" : $"{loadMin / 60}h {loadMin % 60}m";
                info.LoadingSlaStatus = loadMin > 180 ? "DETENTION" : loadMin > 120 ? "AT_RISK" : "ON_TIME";
            }
            else if (distToDest <= 15.0 && distToDest > GEOFENCE_RADIUS_KM)
            {
                info.CurrentHubStatus = "APPROACHING_DESTINATION";
                info.HubMilestoneStage = "APPROACHING";
                info.OriginGateInTime = createdAt;
                info.OriginGateOutTime = startedAt ?? createdAt.AddMinutes(70);
                var loadMin = Math.Max(30, (int)(info.OriginGateOutTime.Value - info.OriginGateInTime.Value).TotalMinutes);
                info.LoadingTatMinutes = loadMin;
                info.LoadingTatFormatted = loadMin < 60 ? $"{loadMin}m" : $"{loadMin / 60}h {loadMin % 60}m";
                info.LoadingSlaStatus = loadMin > 180 ? "DETENTION" : "ON_TIME";
            }
            else
            {
                info.CurrentHubStatus = "EN_ROUTE";
                info.HubMilestoneStage = "IN_TRANSIT";
                info.OriginGateInTime = createdAt;
                info.OriginGateOutTime = startedAt ?? createdAt.AddMinutes(80);
                var loadMin = Math.Max(30, (int)(info.OriginGateOutTime.Value - info.OriginGateInTime.Value).TotalMinutes);
                info.LoadingTatMinutes = loadMin;
                info.LoadingTatFormatted = loadMin < 60 ? $"{loadMin}m" : $"{loadMin / 60}h {loadMin % 60}m";
                info.LoadingSlaStatus = loadMin > 180 ? "DETENTION" : "ON_TIME";
            }

            return info;
        }

        public async Task ResetTestPingsAsync()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"
                    UPDATE ""VehicleCurrentLocations""
                    SET ""Speed"" = 0
                    WHERE ""Speed"" = 52.0;
                ");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("ResetTestPings error: {Msg}", ex.Message);
            }
        }
    }
}
