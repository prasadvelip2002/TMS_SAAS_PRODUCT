using System;

namespace api_backend.Models
{
    public class PurchaseOrder : BaseEntity, ITenantEntity, ICompanyEntity
    {

        public string PONumber { get; set; } = string.Empty; // e.g. PO-1001

        public int TripId { get; set; }
        public Trip? Trip { get; set; }

        public int VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal AdvancePaid { get; set; } // Issued, Acknowledged, Fulfilled, Paid

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
