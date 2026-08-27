using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using System.Linq;
using System;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var trips = await _context.Trips.ToListAsync();
            
            var activeTrips = trips.Count(t => t.Status == "Started" || t.Status == "Assigned");
            var deliveredTrips = trips.Count(t => t.Status == "Delivered" || t.Status == "Closed");
            
            var revenue = trips.Sum(t => t.FreightCharges);
            var activeVendors = await _context.Vendors.CountAsync();

            // Generate data for the charts based on real data
            // Group trips by day of week for the last 7 days
            var last7Days = Enumerable.Range(0, 7).Select(i => DateTime.UtcNow.Date.AddDays(-6 + i)).ToList();
            
            var tripsData = last7Days.Select(date => new {
                name = date.ToString("ddd"),
                trips = trips.Count(t => t.CreatedAt.Date == date)
            }).ToList();

            // Group revenue by month for the last 7 months
            var last7Months = Enumerable.Range(0, 7).Select(i => new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-6 + i)).ToList();
            
            var revenueData = last7Months.Select(monthDate => new {
                name = monthDate.ToString("MMM"),
                revenue = trips.Where(t => t.CreatedAt.Year == monthDate.Year && t.CreatedAt.Month == monthDate.Month).Sum(t => t.FreightCharges)
            }).ToList();

            return Ok(new {
                activeTrips,
                deliveredTrips,
                revenue,
                activeVendors,
                tripsData,
                revenueData
            });
        }
    }
}
