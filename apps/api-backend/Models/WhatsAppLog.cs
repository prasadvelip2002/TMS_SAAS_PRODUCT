using System;
using System;

namespace api_backend.Models
{
    public class WhatsAppLog : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public required string PhoneNumber { get; set; }
        public required string TemplateName { get; set; } // Pending, Sent, Failed
        public string? RecipientName { get; set; }
        public string? Message { get; set; }
        public string? ExternalMessageId { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}
