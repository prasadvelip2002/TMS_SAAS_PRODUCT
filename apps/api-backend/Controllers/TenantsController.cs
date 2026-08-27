using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Platform Admin")]
    public class TenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TenantsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTenants()
        {
            // Ignore query filters for Companies and Users because Platform Admin needs to see all of them
            var tenants = await _context.Tenants
                .Select(t => new {
                    t.Id,
                    t.Name,
                    t.CreatedAt,
                    CompanyCount = _context.Companies.IgnoreQueryFilters().Count(c => c.TenantId == t.Id),
                    UserCount = _context.Users.IgnoreQueryFilters().Count(u => u.TenantId == t.Id)
                })
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
        {
            var tenant = new Tenant { Name = request.TenantName };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            var company = new Company 
            { 
                Name = request.CompanyName,
                TenantId = tenant.Id
            };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            var user = new User 
            { 
                Name = "Admin", 
                Email = request.AdminEmail, 
                PasswordHash = request.AdminPassword, 
                Role = "Tenant Admin",
                TenantId = tenant.Id,
                CompanyId = company.Id
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var defaultPlan = await _context.Plans.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Name == "Free Trial");
            if (defaultPlan == null) {
                defaultPlan = new Plan { Name = "Free Trial", Price = 0, MaxUsers = 5 };
                _context.Plans.Add(defaultPlan);
                await _context.SaveChangesAsync();
            }

            var subscription = new Subscription {
                TenantId = tenant.Id,
                PlanId = defaultPlan.Id,
                SubscriptionStatus = "Trialing",
                EndDate = DateTime.UtcNow.AddDays(14)
            };
            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            return Ok(new { tenantId = tenant.Id, companyId = company.Id, userId = user.Id });
        }
    }

    public class CreateTenantRequest
    {
        public required string TenantName { get; set; }
        public required string CompanyName { get; set; }
        public required string AdminEmail { get; set; }
        public required string AdminPassword { get; set; }
    }
}
