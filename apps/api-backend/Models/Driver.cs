using System;
using System.Collections.Generic;

namespace api_backend.Models
{
    public class Driver : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public required string Name { get; set; }
        public string? Phone { get; set; }
        public string? LicenseNumber { get; set; }
        public DateTime? LicenseExpiry { get; set; }
        public string? Aadhaar { get; set; }
        public int? ExperienceYears { get; set; }
        public string? CurrentStatus { get; set; }

        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public ICollection<Trip>? Trips { get; set; }
    }
}
