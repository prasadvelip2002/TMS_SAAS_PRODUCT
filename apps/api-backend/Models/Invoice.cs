using System;
using System.Collections.Generic;

namespace api_backend.Models
{
    public class Invoice : BaseEntity, ITenantEntity, ICompanyEntity
    {
        public string InvoiceNumber { get; set; } = string.Empty; // e.g. INV-2026-001

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal GrandTotal { get; set; }

        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } // Unpaid, PartiallyPaid, Paid

        public ICollection<Trip>? Trips { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public int CompanyId { get; set; }
        public Company? Company { get; set; }
    }
}
