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
        public double SrcLat { get; set; } = 12.9716;
        public double SrcLng { get; set; } = 77.5946;
        public string DestCity { get; set; } = string.Empty;
        public double DestLat { get; set; } = 19.0760;
        public double DestLng { get; set; } = 72.8777;
        public string? Material { get; set; }
        public DateTime? TripStartDate { get; set; }
        public string TrackingType { get; set; } = "MOBILE_GPS";
    }

    public interface ILocationService
    {
        Task<TripLocation> RecordMobilePingAsync(MobileLocationPingDto dto);
        Task<TripLocation?> FetchSimLocationAsync(int tripId);
        Task<SimConsentResult> RequestSimConsentAsync(int driverId);
        Task<List<LiveVehicleLocationDto>> GetLiveFleetLocationsAsync();
        Task<List<TripLocation>> GetTripTrailHistoryAsync(int tripId, int limit = 100);
        Task<DriverTripDetailsDto?> GetDriverTripDetailsAsync(int tripId);
        Task<bool> StartTripByDriverAsync(int tripId);
        Task<bool> CompleteTripByDriverAsync(int tripId);
    }
}
