using System;

namespace api_backend.Models
{
    public class Indent : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public required string Source { get; set; }
        public required string Destination { get; set; }
        public string? WarehouseLocation { get; set; }
        public string? Material { get; set; }
        public decimal Weight { get; set; }
        public string? VehicleType { get; set; }
        public DateTime LoadingDate { get; set; } // New, Pending, Assigned
        public string? LoadingTime { get; set; } // e.g. "10:00 AM", "14:30"

        public string? PricingModel { get; set; } // AnnualContract, CaseToCase
        public decimal? CustomerRate { get; set; }
        public string RFQStatus { get; set; } = "Pending"; // Pending, Sent, QuotationReceived, Approved, Rejected

        public string? DestinationsJson { get; set; }
        public bool RequiresWhatsAppShare { get; set; }

        public int? BranchId { get; set; }
        public Branch? Branch { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
