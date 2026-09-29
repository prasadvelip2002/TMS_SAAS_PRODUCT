using System;

namespace api_backend.Models
{
    /// <summary>
    /// Represents the current, latest known location for a vehicle.
    /// Separated from TripLocation (history) for high-performance live fleet monitoring.
    /// </summary>
    public class VehicleCurrentLocation : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public int VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public int? DriverId { get; set; }
        public Driver? Driver { get; set; }

        public int? TripId { get; set; }
        public Trip? Trip { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Accuracy { get; set; } // in meters, e.g. 8m for GPS, 600m for SIM LBS
        public double? Speed { get; set; }    // km/h
        public double? Heading { get; set; }  // degrees

        public string TrackingType { get; set; } = "MOBILE_GPS"; // "MOBILE_GPS" | "SIM_TRACKING"
        public string TrackingProvider { get; set; } = "MOBILE"; // "MOBILE", "DOTMOVE", "AIRTEL_DIRECT", etc.
        public string TrackingStatus { get; set; } = "LIVE";     // "LIVE", "STALE", "OFFLINE", "NO_LOCATION", "NO_CONSENT"

        public string? Address { get; set; }
        public string? DeviceId { get; set; }
        public string? Msisdn { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow; // Device capture time
        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow; // Server receipt time
        public DateTime LastLocationAt { get; set; } = DateTime.UtcNow;

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
