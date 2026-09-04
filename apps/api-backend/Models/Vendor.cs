using System;
using System.Collections.Generic;

namespace api_backend.Models
{
    public class Vendor : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public required string Name { get; set; }
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PAN { get; set; }
        public string? GSTIN { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankIFSC { get; set; }
        public string? TDSInfo { get; set; }
        public string? Phone { get; set; }
        public string? RouteRemarks { get; set; }
        public string? Code { get; set; } // e.g. VEND-001 // e.g. Active, Blacklisted

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public ICollection<Vehicle>? Vehicles { get; set; }
        public ICollection<Trip>? Trips { get; set; }
    }
}
