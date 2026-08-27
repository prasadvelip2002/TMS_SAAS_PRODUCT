namespace api_backend.Models
{
    public class Plan : BaseEntity
    {
        public required string Name { get; set; } // e.g. Starter, Professional, Enterprise
        public decimal Price { get; set; }
        public string? BillingCycle { get; set; } = "Monthly"; // Monthly, Yearly

        public int MaxUsers { get; set; } = 5;
        public int MaxTripsPerMonth { get; set; } = 100;
        public int MaxBranches { get; set; } = 1;

        public bool HasVendorPortal { get; set; } = false;
        public bool HasCustomerPortal { get; set; } = false;
        public bool HasDriverApp { get; set; } = false;
    }
}
