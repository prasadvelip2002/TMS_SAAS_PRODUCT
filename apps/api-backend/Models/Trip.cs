using System;
using System.Collections.Generic;

namespace api_backend.Models
{
    public class Trip : BaseEntity, ITenantEntity, ICompanyEntity
    {
        
        public int IndentId { get; set; }
        public Indent? Indent { get; set; }

        public int? VendorId { get; set; }
        public Vendor? Vendor { get; set; }

        public int? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }

        public int? DriverId { get; set; }
        public Driver? Driver { get; set; }

        public decimal FreightCharges { get; set; }
        public decimal AdvanceAmount { get; set; }
        public decimal BalanceAmount { get; set; }
        public string? LRGenerationType { get; set; } // System, Manual
        public string? ManualLRNumber { get; set; }
        public string? LRNumber { get; set; }
        
        public string BookingType { get; set; } = "Fixed"; // Fixed, PerTon
        public decimal RatePerTon { get; set; }
        public decimal FixedRate { get; set; }
        
        public decimal? SupplierRate { get; set; }
        public decimal? CustomerRate { get; set; }
        
        public string? SupervisorName { get; set; }
        public string? SupervisorContact { get; set; }
        public string? SupplierPaymentTo { get; set; } // Vendor, Driver
        public string Status { get; set; } = "Assigned"; // Assigned, Accepted, Started, Delivered, Closed

        public ICollection<Payment>? Payments { get; set; }
        public ICollection<AdditionalCharge>? AdditionalCharges { get; set; }

        public DateTime? TripStartDate { get; set; }
        public DateTime? TripEndDate { get; set; }
        public decimal? StartingKM { get; set; }
        public decimal? EndingKM { get; set; }
        public string? EwayBillNumber { get; set; }
        public decimal? TollCharges { get; set; }
        public decimal? FuelAdvance { get; set; }

        public DateTime? PODUploadedDate { get; set; }
        public DateTime? PODReceivedDate { get; set; }
        
        public string PODMagicLinkToken { get; set; } = Guid.NewGuid().ToString();

        public int? BranchId { get; set; }
        public Branch? Branch { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }
        public int CompanyId { get; set; }
        public Company? Company { get; set; }

        public string LegType { get; set; } = "Direct"; // Direct, InboundLeg1, OutboundLeg2, EntireRoute
        public string? ServiceScope { get; set; } = "EntireRoute"; // SourceToHub, EntireRoute
        public int? ParentTripId { get; set; }
        public Trip? ParentTrip { get; set; }

        public int? InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }
        public bool IsVendorSettled { get; set; } = false;
    }
}
