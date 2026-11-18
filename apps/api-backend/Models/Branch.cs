using System;

namespace api_backend.Models
{
    public class Branch : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public required string Name { get; set; }
        public string? Code { get; set; } // e.g., BLR, PUN, DEL, HYD
        public string? Location { get; set; } // e.g., Hubli, Pune, Bangalore, Chennai, Hyderabad
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? GstNumber { get; set; }
        public bool IsHeadOffice { get; set; } = false;

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
