using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using System.Linq;
using System.Threading.Tasks;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("trips")]
        public async Task<IActionResult> GetTripReport()
        {
            var trips = await _context.Trips
                .AsNoTracking()
                .Include(t => t.Indent)
                    .ThenInclude(i => i.Customer)
                .Include(t => t.Vendor)
                .Include(t => t.Vehicle)
                .Include(t => t.AdditionalCharges)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    TripId = "TRP-" + (1000 + t.Id),
                    Date = t.CreatedAt,
                    CustomerName = t.Indent != null && t.Indent.Customer != null ? t.Indent.Customer.Name : "N/A",
                    Source = t.Indent != null ? t.Indent.Source : "N/A",
                    Destination = t.Indent != null ? t.Indent.Destination : "N/A",
                    Vehicle = t.Vehicle != null ? t.Vehicle.VehicleNumber : "N/A",
                    VendorName = t.Vendor != null ? t.Vendor.Name : (t.LegType == "Direct" ? "Own Fleet" : "N/A"),
                    Status = t.Status,
                    CustomerRate = t.CustomerRate ?? t.Indent.CustomerRate ?? t.FreightCharges,
                    SupplierRate = t.SupplierRate ?? 0m,
                    FuelAdvance = t.FuelAdvance ?? 0m,
                    TollCharges = t.TollCharges ?? 0m,
                    ExtraCharges = t.AdditionalCharges != null ? t.AdditionalCharges.Where(a => a.Status == "Approved").Sum(a => (decimal?)a.Amount) ?? 0m : 0m,
                    TotalCost = (t.SupplierRate ?? 0m) + (t.FuelAdvance ?? 0m) + (t.TollCharges ?? 0m) + (t.AdditionalCharges != null ? t.AdditionalCharges.Where(a => a.Status == "Approved").Sum(a => (decimal?)a.Amount) ?? 0m : 0m),
                    Margin = (t.CustomerRate ?? t.Indent.CustomerRate ?? t.FreightCharges) - ((t.SupplierRate ?? 0m) + (t.FuelAdvance ?? 0m) + (t.TollCharges ?? 0m) + (t.AdditionalCharges != null ? t.AdditionalCharges.Where(a => a.Status == "Approved").Sum(a => (decimal?)a.Amount) ?? 0m : 0m))
                })
                .ToListAsync();

            return Ok(trips);
        }
    }
}
