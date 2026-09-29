using System;
using System.Threading;
using System.Threading.Tasks;

namespace api_backend.Services.Tracking
{
    /// <summary>
    /// Provider implementation for smartphone GPS tracking (React Native driver app or live browser test tool).
    /// </summary>
    public class MobileGpsLocationProvider : ILocationProvider
    {
        public string ProviderName => "MOBILE";
        public string TrackingType => "MOBILE_GPS";

        public Task<ProviderLocationResult?> GetLocationAsync(string trackingIdentifier, CancellationToken ct = default)
        {
            // For mobile GPS, coordinates are pushed directly from the device to the server.
            return Task.FromResult<ProviderLocationResult?>(null);
        }

        public Task<ProviderConsentResult> RequestConsentAsync(string msisdn, CancellationToken ct = default)
        {
            // Device OS handles runtime location permission prompts for mobile apps
            return Task.FromResult(new ProviderConsentResult
            {
                Success = true,
                Status = "Active",
                Message = "Mobile OS location permission granted"
            });
        }
    }
}
