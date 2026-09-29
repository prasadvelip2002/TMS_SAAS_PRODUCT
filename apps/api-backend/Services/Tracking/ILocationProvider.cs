using System;
using System.Threading;
using System.Threading.Tasks;

namespace api_backend.Services.Tracking
{
    public class ProviderLocationResult
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Accuracy { get; set; } // Accuracy in meters (e.g. 8m for GPS, 600m for SIM cell tower)
        public double? Speed { get; set; }
        public double? Heading { get; set; }
        public string? Address { get; set; }
        public string? RawPayload { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
        public bool Success { get; set; } = true;
        public string? ErrorMessage { get; set; }
    }

    public class ProviderConsentResult
    {
        public bool Success { get; set; }
        public string Status { get; set; } = "Pending"; // "Pending", "Active", "Revoked"
        public string? ConsentRef { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Pluggable provider interface for location ingestion & telecom SIM lookups.
    /// Enables swapping Dotmove with direct Airtel / Jio / Vi integrations without touching TMS business logic.
    /// </summary>
    public interface ILocationProvider
    {
        string ProviderName { get; }       // e.g. "MOBILE", "DOTMOVE", "AIRTEL_DIRECT"
        string TrackingType { get; }       // "MOBILE_GPS" or "SIM_TRACKING"

        Task<ProviderLocationResult?> GetLocationAsync(string trackingIdentifier, CancellationToken ct = default);
        Task<ProviderConsentResult> RequestConsentAsync(string msisdn, CancellationToken ct = default);
    }
}
