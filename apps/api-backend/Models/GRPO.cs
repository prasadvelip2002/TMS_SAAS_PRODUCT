using System;

namespace api_backend.Models
{
    public class GRPO : BaseEntity, ITenantEntity, ICompanyEntity
    {

        public string GRPONumber { get; set; } = string.Empty; // e.g. GRPO-5001

        public int PurchaseOrderId { get; set; }
        public PurchaseOrder? PurchaseOrder { get; set; }

        public decimal ReceivedQuantity { get; set; }
        public decimal DamagedQuantity { get; set; }
        public string? Remarks { get; set; }

        public string? PODDocumentUrl { get; set; } // Received, Verified, Disputed

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
