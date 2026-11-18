using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using api_backend.Models;

namespace api_backend.Services.Interfaces
{
    public class MobileLocationPingDto
    {
        public int TripId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Accuracy { get; set; } // in meters
        public double? Speed { get; set; }    // km/h
        public double? Heading { get; set; }  // degrees
        public string? Address { get; set; }
        public string Source { get; set; } = "MOBILE_GPS";
        public string Provider { get; set; } = "MOBILE";
        public string? DeviceId { get; set; }
        public DateTime? RecordedAt { get; set; } // Device timestamp
    }

    public class LiveVehicleLocationDto
    {
        public string Id { get; set; } = string.Empty; // e.g. "TRIP-102"
        public int TripId { get; set; }
        public int VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string? DriverPhone { get; set; }
        
        public string TrackingType { get; set; } = "MOBILE_GPS"; // "MOBILE_GPS" or "SIM_TRACKING"
        public string TrackingProvider { get; set; } = "MOBILE"; // "MOBILE", "DOTMOVE", "AIRTEL", etc.
        public string TrackingBadge { get; set; } = "Mobile GPS"; 
        public string TrackingStatus { get; set; } = "LIVE";     // "LIVE", "STALE", "OFFLINE", "NO_LOCATION", "NO_CONSENT"
        
        public double CurrentLat { get; set; }
        public double CurrentLng { get; set; }
        public double? Accuracy { get; set; } // Dynamic precision radius in meters
        public double Speed { get; set; }
        public double Heading { get; set; }

        public string SourceCity { get; set; } = string.Empty;
        public double SrcLat { get; set; }
        public double SrcLng { get; set; }

        public string DestCity { get; set; } = string.Empty;
        public double DestLat { get; set; }
        public double DestLng { get; set; }

        public string Status { get; set; } = "In_Transit"; // "In_Transit", "Moving", "Delayed", "Halted"
        public string Eta { get; set; } = "Calculating...";
        public DateTime LastPingTime { get; set; }
        public DateTime RecordedAt { get; set; }
        public DateTime ReceivedAt { get; set; }
        public string LastPingAgo { get; set; } = "Just now";
        public string? CurrentAddress { get; set; }

        // Enterprise Safety & Operational Alerts
        public bool IsHalted { get; set; } = false;
        public int HaltDurationMinutes { get; set; } = 0;
        public string? HaltFormatted { get; set; }
        public bool IsRouteDeviated { get; set; } = false;
        public double? DeviationDistanceKm { get; set; }
        public string AlertSeverity { get; set; } = "NORMAL"; // "NORMAL", "WARNING", "CRITICAL"
        public string? AlertMessage { get; set; }
        public string? AlertType { get; set; } // "ROUTE_DEVIATION", "PROLONGED_HALT", "OVERSPEEDING", null

        // Feature 2: Smart Geofencing & Automated Hub Milestones (Turnaround Time TAT)
        public int GeofenceRadiusMeters { get; set; } = 1000;
        public double DistanceToOriginKm { get; set; }
        public double DistanceToDestKm { get; set; }
        public bool IsInsideOriginGeofence { get; set; } = false;
        public bool IsInsideDestGeofence { get; set; } = false;
        public string CurrentHubStatus { get; set; } = "EN_ROUTE"; // "AT_ORIGIN_HUB", "DEPARTED_ORIGIN", "EN_ROUTE", "APPROACHING_DESTINATION", "AT_DESTINATION_HUB"
        public string HubMilestoneStage { get; set; } = "IN_TRANSIT"; // "DISPATCHED", "AT_PICKUP", "IN_TRANSIT", "APPROACHING", "AT_DELIVERY"
        public DateTime? OriginGateInTime { get; set; }
        public DateTime? OriginGateOutTime { get; set; }
        public int? LoadingTatMinutes { get; set; }
        public string? LoadingTatFormatted { get; set; } // e.g. "1h 24m"
        public string LoadingSlaStatus { get; set; } = "ON_TIME"; // "ON_TIME", "AT_RISK", "DETENTION"
        public DateTime? DestGateInTime { get; set; }
        public int? UnloadingTatMinutes { get; set; }
        public string? UnloadingTatFormatted { get; set; }
        public string UnloadingSlaStatus { get; set; } = "ON_TIME";

        // Feature 3: Customer Live Shareable Magic Link
        public string? ShareToken { get; set; }
        public string? CustomerName { get; set; }
        public string? LrNumber { get; set; }

        // Feature 4: Branch Affiliation (Multi-Branch Fleet Isolation & RBAC)
        public int? BranchId { get; set; }
        public string? BranchName { get; set; }

        // Feature 5: Regional Pincode Proximity Search & Discovery
        public double? DistanceFromSearchPincodeKm { get; set; }
        public bool? IsInsideSearchRadius { get; set; }
    }

    public class SimConsentResult
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "Pending"; // "Pending", "Active", "Revoked"
        public string Message { get; set; } = string.Empty;
        public string? ConsentRef { get; set; }
    }

    public class DriverTripDetailsDto
    {
        public int TripId { get; set; }
        public string Status { get; set; } = "Assigned";
        public string VehicleNumber { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string? DriverPhone { get; set; }
        public string SourceCity { get; set; } = string.Empty;
        public double SrcLat { get; set; }
        public double SrcLng { get; set; }
        public string DestCity { get; set; } = string.Empty;
        public double DestLat { get; set; }
        public double DestLng { get; set; }
        public string? Material { get; set; }
        public DateTime? TripStartDate { get; set; }
        public string TrackingType { get; set; } = "MOBILE_GPS";
        public string? CurrentAddress { get; set; }
        public double? CurrentLat { get; set; }
        public double? CurrentLng { get; set; }
        public double Speed { get; set; }
        public string Eta { get; set; } = "Calculating...";
    }

    public class CustomerTrackingDto
    {
        public string ShareToken { get; set; } = string.Empty;
        public int TripId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string VehicleType { get; set; } = "Commercial Freight Vehicle";
        public string? DriverName { get; set; }
        public string? DriverPhone { get; set; }
        public string? SupportHotline { get; set; } = "+91 80000 12345";
        
        public string SourceCity { get; set; } = string.Empty;
        public double SrcLat { get; set; }
        public double SrcLng { get; set; }
        public string DestCity { get; set; } = string.Empty;
        public double DestLat { get; set; }
        public double DestLng { get; set; }
        
        public double CurrentLat { get; set; }
        public double CurrentLng { get; set; }
        public double Speed { get; set; }
        public double Heading { get; set; }
        public string TrackingStatus { get; set; } = "LIVE"; // LIVE, STANDBY, OFFLINE
        public string? CurrentAddress { get; set; }
        public string LastPingAgo { get; set; } = "Just now";
        public DateTime LastPingTime { get; set; }
        
        public string Status { get; set; } = "In_Transit";
        public string Eta { get; set; } = "Calculating...";
        public double DistanceRemainingKm { get; set; }
        public double DistanceTraveledKm { get; set; }
        public double TotalRouteDistanceKm { get; set; }
        public int ProgressPercent { get; set; } // 0 to 100
        
        // Consignment Details
        public string? LRNumber { get; set; }
        public string? EwayBillNumber { get; set; }
        public string? Material { get; set; }
        public decimal? Weight { get; set; }
        public string? CustomerName { get; set; }
        
        // Hub Milestones & Turnaround
        public string CurrentMilestone { get; set; } = "IN_TRANSIT"; // AT_PICKUP, IN_TRANSIT, APPROACHING, AT_DELIVERY, COMPLETED
        public string CurrentMilestoneTitle { get; set; } = "In Highway Transit";
        public string CurrentMilestoneDescription { get; set; } = "Consignment is moving along national highway corridor.";
        public bool IsInsideOriginGeofence { get; set; }
        public bool IsInsideDestGeofence { get; set; }
        public int? LoadingTatMinutes { get; set; }
        public string? LoadingTatFormatted { get; set; }
        public DateTime? DispatchedAt { get; set; }
        public DateTime? EstimatedDeliveryAt { get; set; }
    }

    public class GeocodeResultDto
    {
        public string Query { get; set; } = string.Empty;
        public string? Pincode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? DisplayName { get; set; }
        public bool Success { get; set; }
    }

    public class PincodeFleetQueryResultDto
    {
        public string Pincode { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double RadiusKm { get; set; }
        public int TotalFleetCount { get; set; }
        public int VehiclesInRegionCount { get; set; }
        public List<LiveVehicleLocationDto> Vehicles { get; set; } = new();
    }

    public interface ILocationService
    {
        Task<TripLocation> RecordMobilePingAsync(MobileLocationPingDto dto);
        Task<TripLocation?> FetchSimLocationAsync(int tripId);
        Task<SimConsentResult> RequestSimConsentAsync(int driverId);
        Task<List<LiveVehicleLocationDto>> GetLiveFleetLocationsAsync(int? branchId = null);
        Task<PincodeFleetQueryResultDto> GetVehiclesNearPincodeAsync(string pincode, double radiusKm = 50.0, int? branchId = null);
        Task<LiveVehicleLocationDto?> GetTripTelemetryAsync(int tripId);
        Task<CustomerTrackingDto?> GetCustomerTrackingAsync(string token);
        Task<List<TripLocation>> GetTripTrailHistoryAsync(int tripId, int limit = 100);
        Task<DriverTripDetailsDto?> GetDriverTripDetailsAsync(int tripId);
        Task<bool> StartTripByDriverAsync(int tripId);
        Task<bool> CompleteTripByDriverAsync(int tripId);
        Task<(double Lat, double Lng)> GeocodeLocationAsync(string locationName, string? contextCity = null);
        Task<GeocodeResultDto> GeocodeDetailedAsync(string locationName, string? contextCity = null);
        Task<string?> ReverseGeocodeAsync(double lat, double lng);
        Task ResetTestPingsAsync();
    }
}
