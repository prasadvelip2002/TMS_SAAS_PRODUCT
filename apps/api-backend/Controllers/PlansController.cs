using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlansController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PlansController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Platform Admin,Tenant Admin")]
        public async Task<IActionResult> GetPlans()
        {
            var plans = await _context.Plans.ToListAsync();
            return Ok(plans);
        }

        [HttpPost]
        [Authorize(Roles = "Platform Admin")]
        public async Task<IActionResult> CreatePlan(Plan plan)
        {
            _context.Plans.Add(plan);
            await _context.SaveChangesAsync();
            return Ok(plan);
        }
    }
}
