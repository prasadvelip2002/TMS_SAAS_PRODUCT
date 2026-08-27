using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubscriptionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("current")]
        [Authorize(Roles = "Tenant Admin,Platform Admin")]
        public async Task<IActionResult> GetCurrentSubscription()
        {
            // The global query filter will automatically filter by the current user's TenantId
            var subscription = await _context.Subscriptions
                .Include(s => s.Plan)
                .OrderByDescending(s => s.StartDate)
                .FirstOrDefaultAsync(s => s.SubscriptionStatus == "Active" || s.SubscriptionStatus == "Trialing");
                
            if (subscription == null) return NotFound();
            return Ok(subscription);
        }

        [HttpPost("assign")]
        [Authorize(Roles = "Platform Admin")]
        public async Task<IActionResult> AssignSubscription(int tenantId, int planId)
        {
            // Ignore query filters because Platform Admin needs to assign to any tenant
            var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId);
            var plan = await _context.Plans.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == planId);

            if (tenant == null || plan == null) return BadRequest("Invalid Tenant or Plan");

            var subscription = new Subscription
            {
                TenantId = tenant.Id,
                PlanId = plan.Id,
                SubscriptionStatus = "Active"
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();
            
            return Ok(subscription);
        }
    }
}
