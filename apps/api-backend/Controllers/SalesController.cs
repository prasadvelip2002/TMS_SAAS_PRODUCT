using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System.Linq;
using System.Threading.Tasks;

using System;
using api_backend.Services.Interfaces;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWhatsAppService _whatsAppService;

        public SalesController(ApplicationDbContext context, IWhatsAppService whatsAppService)
        {
            _context = context;
            _whatsAppService = whatsAppService;
        }

        // POST: api/Sales/Quotations/{id}/send-whatsapp
        [HttpPost("Quotations/{id}/send-whatsapp")]
        [Authorize]
        public async Task<IActionResult> SendQuotationWhatsApp(int id)
        {
            var sq = await _context.SalesQuotations
                .Include(s => s.Indent)
                    .ThenInclude(i => i.Customer)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (sq == null) return NotFound("Sales Quotation not found");
            var customer = sq.Indent?.Customer;
            if (customer == null || string.IsNullOrEmpty(customer.Phone))
            {
                return BadRequest(new { message = "Customer has no registered phone number." });
            }

            var result = await _whatsAppService.SendSalesQuotationAsync(sq, sq.Indent, customer);
            return Ok(result);
        }

        // GET: api/Sales/Quotations
        [HttpGet("Quotations")]
        [Authorize]
        public async Task<IActionResult> GetAllSalesQuotations()
        {
            var sqs = await _context.SalesQuotations
                .Include(s => s.WinningVendorQuotation)
                .ThenInclude(v => v.Vendor)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var pos = await _context.CustomerPurchaseOrders
                .ToListAsync();

            var result = sqs.Select(s => new
            {
                s.Id,
                s.IndentId,
                s.CustomerId,
                s.WinningVendorQuotationId,
                s.WinningVendorQuotation,
                s.BaseRate,
                s.Margin,
                s.SellingPrice,
                s.Status,
                s.LegType,
                s.TripId,
                s.CostBreakdownJson,
                s.CreatedAt,
                PONumber = pos.FirstOrDefault(p => p.SalesQuotationId == s.Id || p.IndentId == s.IndentId)?.PONumber
            });

            return Ok(result);
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

            var pos = await _context.CustomerPurchaseOrders
                .Where(p => p.IndentId == indentId)
                .ToListAsync();

            var result = sqs.Select(s => new
            {
                s.Id,
                s.IndentId,
                s.CustomerId,
                s.WinningVendorQuotationId,
                s.WinningVendorQuotation,
                s.BaseRate,
                s.Margin,
                s.SellingPrice,
                s.Status,
                s.LegType,
                s.TripId,
                s.CostBreakdownJson,
                s.CreatedAt,
                PONumber = pos.FirstOrDefault(p => p.SalesQuotationId == s.Id || p.IndentId == s.IndentId)?.PONumber
            });

            return Ok(result);
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
                sellingPrice = (request.SellingPrice.HasValue && request.SellingPrice.Value > 0) 
                    ? request.SellingPrice.Value 
                    : (vendorQuote.QuotedRate + request.Margin);
            }
            else
            {
                // Own Fleet or Direct Quote without vendor bidding
                baseRate = request.BaseRate ?? indent.CustomerRate ?? 0;
                sellingPrice = (request.SellingPrice.HasValue && request.SellingPrice.Value > 0) 
                    ? request.SellingPrice.Value 
                    : (baseRate + request.Margin);
            }

            string? legType = request.LegType;
            if (string.IsNullOrEmpty(legType))
            {
                if (request.VendorQuotationId.HasValue && request.VendorQuotationId.Value > 0)
                {
                    var vendorQuote = await _context.VendorQuotations.FindAsync(request.VendorQuotationId.Value);
                    if (vendorQuote != null)
                    {
                        legType = vendorQuote.ServiceScope == "SourceToHub" ? "InboundLeg1" : "EntireRoute";
                    }
                }
                else if (!string.IsNullOrEmpty(indent.WarehouseLocation))
                {
                    legType = "EntireRoute";
                }
                else
                {
                    legType = "Direct";
                }
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
                LegType = legType,
                TripId = request.TripId,
                CostBreakdownJson = request.CostBreakdownJson,
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
                sq.Indent.CustomerRate = sq.SellingPrice;
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

            if (sq.Indent != null)
            {
                sq.Indent.Status = "Pending Assignment";
            }
            
            // Determine LegType & ServiceScope based on SQ and vendor quote scope
            string serviceScope = sq.WinningVendorQuotation?.ServiceScope ?? "EntireRoute";
            string legType = sq.LegType ?? "Direct";
            if (string.IsNullOrEmpty(sq.LegType))
            {
                if (!string.IsNullOrEmpty(sq.Indent?.WarehouseLocation))
                {
                    legType = (serviceScope == "SourceToHub") ? "InboundLeg1" : "EntireRoute";
                }
            }

            Trip trip;
            if (sq.TripId.HasValue && sq.TripId.Value > 0)
            {
                trip = await _context.Trips.FindAsync(sq.TripId.Value) ?? new Trip();
            }
            else if (legType == "OutboundLeg2")
            {
                trip = await _context.Trips.FirstOrDefaultAsync(t => t.IndentId == sq.IndentId && t.LegType == "OutboundLeg2") ?? new Trip();
            }
            else
            {
                trip = await _context.Trips.FirstOrDefaultAsync(t => t.IndentId == sq.IndentId && t.LegType == legType) ?? new Trip();
            }

            bool isNewTrip = (trip.Id == 0);
            trip.IndentId = sq.IndentId;
            trip.LegType = legType;
            trip.ServiceScope = serviceScope;
            trip.VendorId = sq.WinningVendorQuotation?.VendorId;
            trip.Status = "Pending Assignment";
            trip.BookingType = "Fixed";
            trip.SupplierRate = sq.WinningVendorQuotation?.QuotedRate ?? 0;
            trip.CustomerRate = sq.SellingPrice; // Set agreed price with margin for this leg
            trip.FixedRate = sq.WinningVendorQuotation?.QuotedRate ?? 0;
            trip.CostBreakdownJson = sq.CostBreakdownJson;
            trip.TenantId = sq.TenantId;
            trip.CompanyId = sq.CompanyId;

            if (isNewTrip)
            {
                _context.Trips.Add(trip);
            }
            else
            {
                _context.Entry(trip).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();

            sq.TripId = trip.Id;
            _context.Entry(sq).State = EntityState.Modified;

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
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "SQ Approved, Customer PO Accepted, Trip Ready for Assignment." });
        }

        // GET: api/Sales/QuotationByToken/{token} (Public Magic Link for Customer)
        [HttpGet("QuotationByToken/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetQuotationByToken(string token)
        {
            var sq = await _context.SalesQuotations
                .IgnoreQueryFilters()
                .Include(s => s.Indent)
                    .ThenInclude(i => i.Customer)
                .Include(s => s.WinningVendorQuotation)
                .FirstOrDefaultAsync(s => s.MagicLinkToken == token);

            if (sq == null) return NotFound("Invalid or expired quotation link.");

            return Ok(new
            {
                sq.Id,
                sq.SellingPrice,
                sq.BaseRate,
                sq.Margin,
                sq.Status,
                sq.LegType,
                sq.CostBreakdownJson,
                CustomerName = sq.Indent?.Customer?.Name ?? "Valued Customer",
                CustomerPhone = sq.Indent?.Customer?.Phone,
                Indent = new
                {
                    sq.Indent?.Id,
                    sq.Indent?.Source,
                    sq.Indent?.Destination,
                    sq.Indent?.WarehouseLocation,
                    sq.Indent?.Material,
                    sq.Indent?.Weight,
                    sq.Indent?.VehicleType,
                    sq.Indent?.LoadingDate,
                    sq.Indent?.LoadingTime
                }
            });
        }

        // POST: api/Sales/ApproveByToken/{token} (Public Magic Link for Customer)
        [HttpPost("ApproveByToken/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> ApproveByToken(string token, [FromBody] ApproveByTokenRequest request)
        {
            var sq = await _context.SalesQuotations
                .IgnoreQueryFilters()
                .Include(s => s.Indent)
                .Include(s => s.WinningVendorQuotation)
                .FirstOrDefaultAsync(s => s.MagicLinkToken == token);

            if (sq == null) return NotFound("Invalid or expired quotation link.");

            if (sq.Status == "Approved" || sq.Status == "PO_Received")
            {
                return Ok(new { message = "This quotation has already been approved." });
            }

            var poNumber = string.IsNullOrWhiteSpace(request.PONumber) 
                ? $"PO-APP-{DateTime.UtcNow:MMddHHmm}" 
                : request.PONumber;

            return await ApproveSQ(sq.Id, new ApproveSQRequest { PONumber = poNumber });
        }
    }

    public class ApproveByTokenRequest
    {
        public string PONumber { get; set; } = string.Empty;
        public string? Remarks { get; set; }
    }

    public class GenerateSQRequest
    {
        public int? VendorQuotationId { get; set; }
        public decimal Margin { get; set; }
        public decimal? BaseRate { get; set; }
        public decimal? SellingPrice { get; set; }
        public string? LegType { get; set; }
        public int? TripId { get; set; }
        public string? CostBreakdownJson { get; set; }
    }

    public class ApproveSQRequest
    {
        public string PONumber { get; set; } = string.Empty;
    }
}
