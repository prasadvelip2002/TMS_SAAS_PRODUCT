using System;

namespace api_backend.Models
{
    public class AdditionalCharge : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public int TripId { get; set; }
        public Trip? Trip { get; set; }

        public required string ChargeType { get; set; } // Detention, ExtraKM, Labour, Freight, Halting, ExtraDelivery, Hamali, Miscellaneous, Deduction
        public decimal Amount { get; set; } // PendingApproval, Approved, Rejected

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
