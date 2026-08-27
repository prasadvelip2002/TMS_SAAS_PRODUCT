using System;

namespace api_backend.Models
{
    public class Notification : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        // This could link to a User/Driver model later when Auth is added
        public int? UserId { get; set; } 
        
        public required string Title { get; set; }
        public required string Message { get; set; }
        public bool IsRead { get; set; } = false;

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
