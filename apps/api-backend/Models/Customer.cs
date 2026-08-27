using System;

namespace api_backend.Models
{
    public class Customer : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public required string Name { get; set; }
        public string? GSTIN { get; set; }
        public string? Address { get; set; }
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PAN { get; set; }
        public decimal? CreditLimit { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Code { get; set; }
        public string? RateContract { get; set; }
        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
