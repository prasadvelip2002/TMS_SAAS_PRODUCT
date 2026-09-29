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

        // Dynamic In-Memory Geocoding Cache (Pre-seeded with major Indian logistics hubs, ports & cities for instant 0ms lookup)
        private static readonly ConcurrentDictionary<string, (double Lat, double Lng)> _dynamicGeoCache = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Bangalore"] = (12.9716, 77.5946),
            ["Bengaluru"] = (12.9716, 77.5946),
            ["Mumbai"] = (19.0760, 72.8777),
            ["Bombay"] = (19.0760, 72.8777),
            ["Delhi"] = (28.6139, 77.2090),
            ["New Delhi"] = (28.6139, 77.2090),
            ["Chennai"] = (13.0827, 80.2707),
            ["Madras"] = (13.0827, 80.2707),
            ["Hyderabad"] = (17.3850, 78.4867),
            ["Pune"] = (18.5204, 73.8567),
            ["Ahmedabad"] = (23.0225, 72.5714),
            ["Kolkata"] = (22.5726, 88.3639),
            ["Calcutta"] = (22.5726, 88.3639),
            ["Surat"] = (21.1702, 72.8311),
            ["Jaipur"] = (26.9124, 75.7873),
            ["Lucknow"] = (26.8467, 80.9462),
            ["Kanpur"] = (26.4499, 80.3319),
            ["Nagpur"] = (21.1458, 79.0882),
            ["Indore"] = (22.7196, 75.8577),
            ["Bhopal"] = (23.2599, 77.4126),
            ["Visakhapatnam"] = (17.6868, 83.2185),
            ["Vizag"] = (17.6868, 83.2185),
            ["Vadodara"] = (22.3072, 73.1812),
            ["Baroda"] = (22.3072, 73.1812),
            ["Ludhiana"] = (30.9010, 75.8573),
            ["Agra"] = (27.1767, 78.0081),
            ["Nashik"] = (19.9975, 73.7898),
            ["Faridabad"] = (28.4089, 77.3178),
            ["Meerut"] = (28.9845, 77.7064),
            ["Rajkot"] = (22.3039, 70.8022),
            ["Varanasi"] = (25.3176, 82.9739),
            ["Aurangabad"] = (19.8762, 75.3433),
            ["Chhatrapati Sambhajinagar"] = (19.8762, 75.3433),
            ["Amritsar"] = (31.6340, 74.8723),
            ["Ranchi"] = (23.3441, 85.3096),
            ["Coimbatore"] = (11.0168, 76.9558),
            ["Jabalpur"] = (23.1815, 79.9864),
            ["Gwalior"] = (26.2183, 78.1828),
            ["Vijayawada"] = (16.5062, 80.6480),
            ["Jodhpur"] = (26.2389, 73.0243),
            ["Madurai"] = (9.9252, 78.1198),
            ["Raipur"] = (21.2514, 81.6296),
            ["Kota"] = (25.2138, 75.8648),
            ["Guwahati"] = (26.1445, 91.7362),
            ["Chandigarh"] = (30.7333, 76.7794),
            ["Solapur"] = (17.6599, 75.9064),
            ["Hubli"] = (15.3647, 75.1240),
            ["Hubballi"] = (15.3647, 75.1240),
            ["Dharwad"] = (15.4589, 75.0078),
            ["Mysore"] = (12.2958, 76.6394),
            ["Mysuru"] = (12.2958, 76.6394),
            ["Mangalore"] = (12.9141, 74.8560),
            ["Managalore"] = (12.9141, 74.8560),
            ["Mangaluru"] = (12.9141, 74.8560),
            ["Kerala"] = (10.8505, 76.2711),
            ["Kochi"] = (9.9312, 76.2673),
            ["Cochin"] = (9.9312, 76.2673),
            ["Kozhikode"] = (11.2588, 75.7804),
            ["Calicut"] = (11.2588, 75.7804),
            ["Thiruvananthapuram"] = (8.5241, 76.9366),
            ["Trivandrum"] = (8.5241, 76.9366),
            ["Thrissur"] = (10.5276, 76.2144),
            ["Kannur"] = (11.8745, 75.3704),
            ["Goa"] = (15.2993, 74.1240),
            ["Panaji"] = (15.4909, 73.8278),
            ["Belgaum"] = (15.8497, 74.4977),
            ["Belagavi"] = (15.8497, 74.4977),
            ["Bidar"] = (17.9104, 77.5199),
            ["Bellary"] = (15.1394, 76.9214),
            ["Ballari"] = (15.1394, 76.9214),
            ["Davanagere"] = (14.4644, 75.9218),
            ["Shivamogga"] = (13.9299, 75.5681),
            ["Shimoga"] = (13.9299, 75.5681),
            ["Tumkur"] = (13.3379, 77.1010),
            ["Tumakuru"] = (13.3379, 77.1010),
            ["Udupi"] = (13.3409, 74.7421),
            ["Karwar"] = (14.8136, 74.1298),
            ["Kolhapur"] = (16.7050, 74.2433),
            ["Sangli"] = (16.8524, 74.5815),
            ["Satara"] = (17.6805, 74.0183),
            ["Noida"] = (28.5355, 77.3910),
            ["Gurgaon"] = (28.4595, 77.0266),
            ["Gurugram"] = (28.4595, 77.0266),
            ["Bhiwandi"] = (19.2967, 73.0631),
            ["Navi Mumbai"] = (19.0330, 73.0297),
            ["Thane"] = (19.2183, 72.9781),
            ["Vapi"] = (20.3719, 72.9044),
            ["Ankleshwar"] = (21.6264, 73.0152),
            ["Gandhidham"] = (23.0753, 70.1337),
            ["Mundra"] = (22.8394, 69.7258),
            ["Kandla"] = (23.0033, 70.2186),
            ["JNPT"] = (18.9500, 72.9500),
            ["Nhava Sheva"] = (18.9500, 72.9500),
            ["Salem"] = (11.6643, 78.1460),
            ["Tiruppur"] = (11.1085, 77.3411),
            ["Trichy"] = (10.7905, 78.7047),
            ["Tiruchirappalli"] = (10.7905, 78.7047),
            ["Hosur"] = (12.7409, 77.8253),
            ["Sriperumbudur"] = (12.9691, 79.9416),
            ["Tirupati"] = (13.6288, 79.4192),
            ["Nellore"] = (14.4426, 79.9865),
            ["Guntur"] = (16.3067, 80.4365),
            ["Warangal"] = (17.9689, 79.5941),
            ["Bhubaneswar"] = (20.2961, 85.8245),
            ["Cuttack"] = (20.4625, 85.8828),
            ["Jamshedpur"] = (22.8046, 86.2029),
            ["Dhanbad"] = (23.7957, 86.4304),
            ["Patna"] = (25.5941, 85.1376),
            ["Gaya"] = (24.7914, 85.0002),
            ["Dehradun"] = (30.3165, 78.0322),
            ["Haridwar"] = (29.9457, 78.1642)
        };
        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(3) };

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

            // 1. Insert into Historical Breadcrumbs Table
            var historyRecord = new TripLocation
            {
                TripId = trip.Id,
                VehicleId = trip.VehicleId,
                DriverId = trip.DriverId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Accuracy = dto.Accuracy ?? 8.0, // Default 8m for GPS
                Speed = dto.Speed ?? 0.0,
                Heading = dto.Heading ?? 0.0,
                Source = "MOBILE_GPS",
                Provider = providerName,
                DeviceId = dto.DeviceId,
                Msisdn = trip.Driver?.Phone,
                Address = dto.Address,
                RecordedAt = recordedTime,
                ReceivedAt = receivedTime,
                TenantId = trip.TenantId,
                CompanyId = trip.CompanyId
            };

            _context.TripLocations.Add(historyRecord);

            // 2. Upsert Current Vehicle Location (High-performance latest position table)
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
                        Latitude = dto.Latitude,
                        Longitude = dto.Longitude,
                        Accuracy = dto.Accuracy ?? 8.0,
                        Speed = dto.Speed ?? 0.0,
                        Heading = dto.Heading ?? 0.0,
                        TrackingType = "MOBILE_GPS",
                        TrackingProvider = providerName,
                        TrackingStatus = "LIVE",
                        Address = dto.Address,
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
                    currentLoc.Speed = dto.Speed ?? 0.0;
                    currentLoc.Heading = dto.Heading ?? 0.0;
                    currentLoc.TrackingType = "MOBILE_GPS";
                    currentLoc.TrackingProvider = providerName;
                    currentLoc.TrackingStatus = "LIVE";
                    currentLoc.DeviceId = dto.DeviceId ?? currentLoc.DeviceId;
                    currentLoc.Msisdn = trip.Driver?.Phone ?? currentLoc.Msisdn;
                    currentLoc.RecordedAt = recordedTime;
                    currentLoc.ReceivedAt = receivedTime;
                    currentLoc.LastLocationAt = receivedTime;
                    if (!string.IsNullOrEmpty(dto.Address)) currentLoc.Address = dto.Address;
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
                var srcCoords = await ResolveCoordinatesAsync(srcCity, 12.9716, 77.5946);
                var destCoords = await ResolveCoordinatesAsync(destCity, 19.0760, 72.8777);

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
                Speed = providerResult.Speed ?? 52.0,
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
                        Speed = providerResult.Speed ?? 52.0,
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
                    currentLoc.Speed = providerResult.Speed ?? 52.0;
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

        public async Task<List<LiveVehicleLocationDto>> GetLiveFleetLocationsAsync()
        {
            var result = new List<LiveVehicleLocationDto>();
            var seenTripIds = new HashSet<int>();
            var seenVehicleIds = new HashSet<int>();

            // 1. Query high-performance VehicleCurrentLocations joined with Vehicle and active Trip
            var currentLocations = await _context.VehicleCurrentLocations
                .IgnoreQueryFilters()
                .Include(c => c.Vehicle)
                .Include(c => c.Driver)
                .Include(c => c.Trip)
                    .ThenInclude(t => t!.Indent)
                .Where(c => c.Trip != null && (c.Trip.Status == "In_Transit" || c.Trip.Status == "Active" || c.Trip.Status == "Started" || c.Trip.Status == "Assigned"))
                .OrderByDescending(c => c.LastLocationAt)
                .ToListAsync();

            var now = DateTime.UtcNow;

            foreach (var loc in currentLocations)
            {
                if (loc.TripId.HasValue) seenTripIds.Add(loc.TripId.Value);
                seenVehicleIds.Add(loc.VehicleId);

                var minutesSincePing = (now - loc.LastLocationAt).TotalMinutes;
                var freshnessStatus = loc.Trip?.Status == "Assigned" && minutesSincePing > 120.0 ? "ASSIGNED" :
                                      minutesSincePing <= 2.0 ? "LIVE" :
                                      minutesSincePing <= 10.0 ? "STALE" : "OFFLINE";

                var srcCity = loc.Trip?.Indent?.Source ?? "Source Hub";
                var destCity = loc.Trip?.Indent?.Destination ?? "Destination Hub";
                var srcCoords = await ResolveCoordinatesAsync(srcCity, 12.9716, 77.5946);
                var destCoords = await ResolveCoordinatesAsync(destCity, 19.0760, 72.8777);

                var badge = loc.TrackingType == "SIM_TRACKING" 
                    ? $"🟢 SIM ({loc.TrackingProvider})" 
                    : $"🔵 Mobile GPS ({loc.TrackingProvider})";

                var minAgoInt = Math.Max(0, (int)minutesSincePing);
                var lastPingAgo = minAgoInt == 0 ? "Just now" : $"{minAgoInt} min ago";

                var distanceKm = CalculateDistanceKm(loc.Latitude, loc.Longitude, destCoords.Lat, destCoords.Lng);
                string dynamicEta;
                if (distanceKm < 1.0)
                {
                    dynamicEta = "Arrived at Destination";
                }
                else if ((loc.Speed ?? 0) >= 15)
                {
                    var hours = distanceKm / loc.Speed.Value;
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
                    Speed = loc.Speed ?? 0.0,
                    Heading = loc.Heading ?? 0.0,
                    SourceCity = srcCity,
                    SrcLat = srcCoords.Lat,
                    SrcLng = srcCoords.Lng,
                    DestCity = destCity,
                    DestLat = destCoords.Lat,
                    DestLng = destCoords.Lng,
                    Status = loc.Trip?.Status == "Assigned" ? "Assigned (Loading)" : (loc.Speed ?? 0) > 0 ? "In_Transit" : "Halted",
                    Eta = dynamicEta,
                    LastPingTime = loc.LastLocationAt,
                    RecordedAt = loc.RecordedAt,
                    ReceivedAt = loc.ReceivedAt,
                    LastPingAgo = lastPingAgo,
                    CurrentAddress = loc.Address ?? $"{srcCity} to {destCity} Corridor"
                });
            }

            // 2. Query all active trips that don't yet have telemetry pings (e.g. newly Assigned or In_Transit before 1st ping)
            var activeTrips = await _context.Trips
                .IgnoreQueryFilters()
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Indent)
                .Where(t => (t.Status == "Assigned" || t.Status == "In_Transit" || t.Status == "Active" || t.Status == "Started") && t.VehicleId != null)
                .OrderByDescending(t => t.Id)
                .ToListAsync();

            foreach (var trip in activeTrips)
            {
                if (seenTripIds.Contains(trip.Id) || (trip.VehicleId.HasValue && seenVehicleIds.Contains(trip.VehicleId.Value)))
                {
                    continue;
                }

                var srcCity = trip.Indent?.Source ?? "Source Hub";
                var destCity = trip.Indent?.Destination ?? "Destination Hub";
                var srcCoords = await ResolveCoordinatesAsync(srcCity, 12.9716, 77.5946);
                var destCoords = await ResolveCoordinatesAsync(destCity, 19.0760, 72.8777);

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
                    CurrentAddress = $"Origin Hub: {srcCity}"
                });

                seenTripIds.Add(trip.Id);
                if (trip.VehicleId.HasValue) seenVehicleIds.Add(trip.VehicleId.Value);
            }

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
            var srcCoords = await ResolveCoordinatesAsync(srcCity, 12.9716, 77.5946);
            var destCoords = await ResolveCoordinatesAsync(destCity, 19.0760, 72.8777);

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
                TrackingType = trip.Driver?.TrackingType ?? "MOBILE_GPS"
            };
        }

        public async Task<bool> StartTripByDriverAsync(int tripId)
        {
            var trip = await _context.Trips
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) return false;

            trip.Status = "In_Transit";
            trip.TripStartDate = DateTime.UtcNow;
            _context.Entry(trip).State = EntityState.Modified;
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

        private async Task<(double Lat, double Lng)> ResolveCoordinatesAsync(string locationName, double defaultLat = 20.5937, double defaultLng = 78.9629)
        {
            if (string.IsNullOrWhiteSpace(locationName)) return (defaultLat, defaultLng);

            var cleanKey = locationName.Trim();
            if (_dynamicGeoCache.TryGetValue(cleanKey, out var cached))
            {
                return cached;
            }

            try
            {
                var url = $"https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q={Uri.EscapeDataString(cleanKey)}";
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("User-Agent", "TransitFlow-TMS/2.0 (Dynamic Logistics Geocoder)");

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
                                var resolved = (lat, lon);
                                _dynamicGeoCache[cleanKey] = resolved;
                                _logger.LogInformation("Dynamically geocoded '{Location}' -> Lat {Lat}, Lng {Lng}", cleanKey, lat, lon);
                                return resolved;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Dynamic geocoding for '{Location}' encountered: {Message}", cleanKey, ex.Message);
            }

            return (defaultLat, defaultLng);
        }
    }
}
