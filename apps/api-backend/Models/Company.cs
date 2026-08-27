using System.Collections.Generic;

namespace api_backend.Models
{
    public class Company : BaseEntity, ITenantEntity
    {
        public required string Name { get; set; }
        public string? GSTIN { get; set; }
        public string? Address { get; set; }
        
        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public ICollection<Branch>? Branches { get; set; }
        public ICollection<User>? Users { get; set; }
    }
}
