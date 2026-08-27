using System;

namespace api_backend.Models
{
    public class Branch : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public required string Name { get; set; }
        public string? Location { get; set; } // e.g., Hubli, Pune, Bangalore, Chennai, Hyderabad

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
