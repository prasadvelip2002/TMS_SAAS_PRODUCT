using System;

namespace api_backend.Models
{
    public class Subscription : BaseEntity
    {
        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int PlanId { get; set; }
        public Plan? Plan { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; } 

        public string SubscriptionStatus { get; set; } = "Trialing"; // Trialing, Active, Suspended, Cancelled
    }
}
