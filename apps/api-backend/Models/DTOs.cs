using System;

namespace api_backend.Models
{
    public class AssignTripRequest
    {
        public int? TripId { get; set; }
        public int IndentId { get; set; }
        public int? VendorId { get; set; }
        public int VehicleId { get; set; }
        public int DriverId { get; set; }
        public string BookingType { get; set; } = "Fixed";
        public decimal RatePerTon { get; set; }
        public decimal FixedRate { get; set; }
        public decimal AdvanceAmount { get; set; }
        public string SupplierPaymentTo { get; set; } = "Vendor";
        public decimal? StartingKM { get; set; }
        public DateTime? TripStartDate { get; set; }
    }

    public class UpdateTripStatusRequest
    {
        public required string Status { get; set; }
    }
}
