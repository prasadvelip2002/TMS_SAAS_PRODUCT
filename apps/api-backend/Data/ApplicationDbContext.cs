using Microsoft.EntityFrameworkCore;
using api_backend.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System;

namespace api_backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<Driver> Drivers { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<Indent> Indents { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<AdditionalCharge> AdditionalCharges { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<WhatsAppLog> WhatsAppLogs { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<SupplierQuotation> SupplierQuotations { get; set; }
        public DbSet<TripEvent> TripEvents { get; set; }
        public DbSet<CustomerRateContract> CustomerRateContracts { get; set; }
        public DbSet<VendorQuotation> VendorQuotations { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<GRPO> GRPOs { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Plan> Plans { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }

        public int CurrentTenantId 
        { 
            get 
            {
                var tenantClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId")?.Value;
                if (int.TryParse(tenantClaim, out int tenantId)) return tenantId;
                return 0; 
            } 
        }

        public int CurrentCompanyId 
        { 
            get 
            {
                var companyClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("CompanyId")?.Value;
                if (int.TryParse(companyClaim, out int companyId)) return companyId;
                return 0; 
            } 
        }

        public int CurrentUserId 
        { 
            get 
            {
                var userClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userClaim, out int userId)) return userId;
                return 0; 
            } 
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Customer>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Vendor>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Branch>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Driver>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Vehicle>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Indent>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Trip>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Payment>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<AdditionalCharge>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Document>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Notification>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<WhatsAppLog>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<SupplierQuotation>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<TripEvent>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<CustomerRateContract>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<VendorQuotation>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<PurchaseOrder>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<GRPO>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Invoice>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<User>().HasQueryFilter(x => x.TenantId == CurrentTenantId && x.CompanyId == CurrentCompanyId);
            modelBuilder.Entity<Company>().HasQueryFilter(x => x.TenantId == CurrentTenantId);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var tenantId = CurrentTenantId;
            var companyId = CurrentCompanyId;
            var userId = CurrentUserId;

            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.Entity is BaseEntity baseEntity)
                {
                    if (entry.State == EntityState.Added)
                    {
                        baseEntity.CreatedAt = DateTime.UtcNow;
                        baseEntity.CreatedBy = userId > 0 ? userId : null;
                    }
                    if (entry.State == EntityState.Modified)
                    {
                        baseEntity.UpdatedAt = DateTime.UtcNow;
                        baseEntity.UpdatedBy = userId > 0 ? userId : null;
                    }
                }

                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity is ITenantEntity tenantEntity && tenantId > 0 && tenantEntity.TenantId == 0)
                    {
                        tenantEntity.TenantId = tenantId;
                    }
                    if (entry.Entity is ICompanyEntity companyEntity && companyId > 0 && companyEntity.CompanyId == 0)
                    {
                        companyEntity.CompanyId = companyId;
                    }
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
