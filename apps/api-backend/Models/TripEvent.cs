using System;

namespace api_backend.Models
{
    public class TripEvent : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public int TripId { get; set; }
        public Trip? Trip { get; set; }

        public required string EventType { get; set; } // ReachedLoading, LoadingCompleted, TripStarted, ReachedDestination, UnloadingCompleted
        
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? LocationAddress { get; set; }
        
        public DateTime EventTime { get; set; } = DateTime.UtcNow;

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
