using System;

namespace api_backend.Models
{
    public class CustomerPurchaseOrder : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public int? IndentId { get; set; }
        public Indent? Indent { get; set; }

        public int? SalesQuotationId { get; set; }
        public SalesQuotation? SalesQuotation { get; set; }

        public string PONumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
