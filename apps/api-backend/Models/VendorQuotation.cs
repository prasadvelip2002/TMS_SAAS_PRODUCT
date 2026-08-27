using System;

namespace api_backend.Models
{
    public class VendorQuotation : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public int IndentId { get; set; }
        public Indent? Indent { get; set; }

        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        public decimal QuotedRate { get; set; }
        public string? ProposedVehicleType { get; set; }
        public string? Remarks { get; set; } // Pending, Approved, Rejected

        public string MagicLinkToken { get; set; } = Guid.NewGuid().ToString();

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
