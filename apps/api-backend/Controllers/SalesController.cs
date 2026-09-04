using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System.Linq;
using System.Threading.Tasks;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SalesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Sales/Quotations/{indentId}
        [HttpGet("Quotations/{indentId}")]
        [Authorize]
        public async Task<IActionResult> GetSalesQuotations(int indentId)
        {
            var sqs = await _context.SalesQuotations
                .Include(s => s.WinningVendorQuotation)
                .ThenInclude(v => v.Vendor)
                .Where(s => s.IndentId == indentId)
                .ToListAsync();
            return Ok(sqs);
        }

        // POST: api/Sales/GenerateSQ/{indentId}
        [HttpPost("GenerateSQ/{indentId}")]
        [Authorize]
        public async Task<IActionResult> GenerateSQ(int indentId, [FromBody] GenerateSQRequest request)
        {
            var indent = await _context.Indents.FindAsync(indentId);
            if (indent == null) return NotFound("Indent not found");

            decimal baseRate = 0;
            decimal sellingPrice = 0;

            if (request.VendorQuotationId.HasValue && request.VendorQuotationId.Value > 0)
            {
                var vendorQuote = await _context.VendorQuotations.FindAsync(request.VendorQuotationId.Value);
                if (vendorQuote == null) return NotFound("Vendor quotation not found");
                baseRate = vendorQuote.QuotedRate;
                sellingPrice = vendorQuote.QuotedRate + request.Margin;
            }
            else
            {
                // Own Fleet or Direct Quote without vendor bidding
                baseRate = request.BaseRate ?? indent.CustomerRate ?? 0;
                sellingPrice = (request.SellingPrice.HasValue && request.SellingPrice.Value > 0) 
                    ? request.SellingPrice.Value 
                    : (baseRate + request.Margin);
            }

            var sq = new SalesQuotation
            {
                IndentId = indentId,
                CustomerId = indent.CustomerId,
                WinningVendorQuotationId = (request.VendorQuotationId.HasValue && request.VendorQuotationId.Value > 0) ? request.VendorQuotationId : null,
                BaseRate = baseRate,
                Margin = request.Margin,
                SellingPrice = sellingPrice,
                Status = "Generated",
                TenantId = indent.TenantId,
                CompanyId = indent.CompanyId
            };

            _context.SalesQuotations.Add(sq);

            indent.Status = "SQ_Generated";
            _context.Entry(indent).State = EntityState.Modified;

            await _context.SaveChangesAsync();
            return Ok(sq);
        }

        // POST: api/Sales/ApproveSQ/{sqId}
        [HttpPost("ApproveSQ/{sqId}")]
        [Authorize]
        public async Task<IActionResult> ApproveSQ(int sqId, [FromBody] ApproveSQRequest request)
        {
            var sq = await _context.SalesQuotations
                .Include(s => s.Indent)
                .Include(s => s.WinningVendorQuotation)
                .FirstOrDefaultAsync(s => s.Id == sqId);

            if (sq == null) return NotFound("Sales Quotation not found");

            sq.Status = "Approved";
            if (sq.Indent != null)
            {
                sq.Indent.Status = "PO_Received";
            }

            var customerPO = new CustomerPurchaseOrder
            {
                CustomerId = sq.CustomerId,
                IndentId = sq.IndentId,
                SalesQuotationId = sq.Id,
                PONumber = request.PONumber,
                TotalAmount = sq.SellingPrice,
                Status = "Accepted",
                TenantId = sq.TenantId,
                CompanyId = sq.CompanyId
            };

            _context.CustomerPurchaseOrders.Add(customerPO);

            // Now that Customer PO is accepted, the indent is ready for assignment
            if (sq.Indent != null)
            {
                sq.Indent.Status = "Assigned";
            }
            
            // Auto-generate Trip (for Own fleet, VendorId will be null and SupplierRate 0)
            var trip = new Trip
            {
                IndentId = sq.IndentId,
                VendorId = sq.WinningVendorQuotation?.VendorId,
                Status = "Assigned",
                BookingType = "Fixed",
                SupplierRate = sq.WinningVendorQuotation?.QuotedRate ?? 0,
                CustomerRate = sq.SellingPrice,
                FixedRate = sq.WinningVendorQuotation?.QuotedRate ?? 0,
                TenantId = sq.TenantId,
                CompanyId = sq.CompanyId
            };
            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            // Auto-generate Supplier PO ONLY if it was awarded to a 3rd party vendor
            if (sq.WinningVendorQuotation != null)
            {
                var supplierPo = new PurchaseOrder
                {
                    PONumber = $"PO-{trip.Id.ToString().PadLeft(4, '0')}",
                    TripId = trip.Id,
                    VendorId = sq.WinningVendorQuotation.VendorId,
                    TotalAmount = sq.WinningVendorQuotation.QuotedRate,
                    Status = "Issued",
                    TenantId = sq.TenantId,
                    CompanyId = sq.CompanyId
                };
                _context.PurchaseOrders.Add(supplierPo);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "SQ Approved, Customer PO Accepted, Trip Ready for Assignment." });
        }
    }

    public class GenerateSQRequest
    {
        public int? VendorQuotationId { get; set; }
        public decimal Margin { get; set; }
        public decimal? BaseRate { get; set; }
        public decimal? SellingPrice { get; set; }
    }

    public class ApproveSQRequest
    {
        public string PONumber { get; set; } = string.Empty;
    }
}
