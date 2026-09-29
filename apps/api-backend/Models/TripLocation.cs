using System;

namespace api_backend.Models
{
    public class TripLocation : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public int TripId { get; set; }
        public Trip? Trip { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public int? DriverId { get; set; }
        public Driver? Driver { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Accuracy { get; set; } // in meters, e.g. 10m for Mobile GPS, 150m for SIM LBS
        public double? Speed { get; set; }    // km/h
        public double? Heading { get; set; }  // 0-360 degrees

        public string Source { get; set; } = "MOBILE_GPS"; // "MOBILE_GPS", "SIM_TRACKING", "HARDWARE_GPS"
        public string Provider { get; set; } = "MOBILE";    // "MOBILE", "DOTMOVE", "AIRTEL", "JIO", "VI"
        public string? DeviceId { get; set; }
        public string? Msisdn { get; set; }
        public string? Address { get; set; }
        public string? RawPayloadJson { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow; // When device generated point
        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow; // When server received point

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
