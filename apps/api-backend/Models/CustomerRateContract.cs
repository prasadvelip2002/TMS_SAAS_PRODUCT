using System;

namespace api_backend.Models
{
    public class CustomerRateContract : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public required string Source { get; set; }
        public required string Destination { get; set; }
        public string? VehicleType { get; set; }
        
        public decimal Rate { get; set; }
        
        public DateTime EffectiveFrom { get; set; }
        public DateTime EffectiveTo { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
