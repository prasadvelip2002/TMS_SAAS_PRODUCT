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
        public string Source { get; set; } = "MOBILE_GPS"; // "MOBILE_GPS"
    }

    public class LiveVehicleLocationDto
    {
        public string Id { get; set; } = string.Empty; // e.g. "TRIP-102"
        public int TripId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string? DriverPhone { get; set; }
        public string TrackingType { get; set; } = "MOBILE_GPS"; // "MOBILE_GPS" or "SIM_TRACKING"
        public string TrackingBadge { get; set; } = "Mobile GPS"; // "Mobile GPS (Smartphone)" or "SIM LBS (Keypad Phone)"
        public string Source { get; set; } = "MOBILE_GPS";
        
        public double CurrentLat { get; set; }
        public double CurrentLng { get; set; }
        public double? Accuracy { get; set; }
        public double Speed { get; set; }
        public double Heading { get; set; }

        public string SourceCity { get; set; } = string.Empty;
        public double SrcLat { get; set; }
        public double SrcLng { get; set; }

        public string DestCity { get; set; } = string.Empty;
        public double DestLat { get; set; }
        public double DestLng { get; set; }

        public string Status { get; set; } = "In_Transit"; // "Moving", "Delayed", "Halted"
        public string Eta { get; set; } = "Calculating...";
        public DateTime LastPingTime { get; set; }
        public string LastPingAgo { get; set; } = "Just now";
        public string? CurrentAddress { get; set; }
    }

    public class SimConsentResult
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "Pending"; // "Requested", "Active", "Failed"
        public string Message { get; set; } = string.Empty;
        public string? ConsentRef { get; set; }
    }

    public interface ILocationService
    {
        Task<TripLocation> RecordMobilePingAsync(MobileLocationPingDto dto);
        Task<TripLocation?> FetchSimLocationAsync(int tripId);
        Task<SimConsentResult> RequestSimConsentAsync(int driverId);
        Task<List<LiveVehicleLocationDto>> GetLiveFleetLocationsAsync();
        Task<List<TripLocation>> GetTripTrailHistoryAsync(int tripId, int limit = 100);
    }
}
