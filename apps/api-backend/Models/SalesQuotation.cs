using System;

namespace api_backend.Models
{
    public class SalesQuotation : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public int IndentId { get; set; }
        public Indent? Indent { get; set; }

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public int? WinningVendorQuotationId { get; set; }
        public VendorQuotation? WinningVendorQuotation { get; set; }

        public decimal BaseRate { get; set; } // The rate from the vendor
        public decimal Margin { get; set; } // Margin added by admin
        public decimal SellingPrice { get; set; } // Final rate offered to customer

        public string Status { get; set; } = "Generated"; // Generated, Sent, Approved, Rejected, PO_Received

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
