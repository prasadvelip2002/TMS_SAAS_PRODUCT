using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FinanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FinanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Finance/vendor-settlements
        [HttpGet("vendor-settlements")]
        public async Task<IActionResult> GetPendingVendorSettlements()
        {
            var trips = await _context.Trips
                .Include(t => t.Vendor)
                .Include(t => t.Indent)
                .ThenInclude(i => i.Customer)
                .Include(t => t.Payments)
                .Where(t => t.Status == "Closed" && t.VendorId != null)
                .ToListAsync();

            return Ok(trips);
        }

        // POST: api/Finance/vendor-settlement/{tripId}
        [HttpPost("vendor-settlement/{tripId}")]
        public async Task<IActionResult> SettleVendorPayment(int tripId, [FromBody] SettlePaymentRequest request)
        {
            var trip = await _context.Trips.FindAsync(tripId);
            if (trip == null) return NotFound("Trip not found");

            trip.IsVendorSettled = true;
            _context.Entry(trip).State = EntityState.Modified;

            var payment = new Payment
            {
                TripId = trip.Id,
                Amount = request.Amount,
                Type = "Final",
                BeneficiaryType = "Vendor",
                UTRNumber = request.UTRNumber,
                Status = "Completed"
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Vendor settled successfully" });
        }

        // GET: api/Finance/unbilled-trips/{customerId}
        [HttpGet("unbilled-trips/{customerId}")]
        public async Task<IActionResult> GetUnbilledTrips(int customerId)
        {
            var trips = await _context.Trips
                .Include(t => t.Indent)
                .Include(t => t.AdditionalCharges)
                .Where(t => t.Status == "Closed" && t.InvoiceId == null && t.Indent.CustomerId == customerId)
                .ToListAsync();

            return Ok(trips);
        }

        // POST: api/Finance/invoice
        [HttpPost("invoice")]
        public async Task<IActionResult> GenerateInvoice([FromBody] GenerateInvoiceRequest request)
        {
            if (request.TripIds == null || request.TripIds.Count == 0)
                return BadRequest("No trips selected for invoicing");

            var trips = await _context.Trips
                .Include(t => t.Indent)
                .Include(t => t.AdditionalCharges)
                .Where(t => request.TripIds.Contains(t.Id))
                .ToListAsync();

            if (trips.Count == 0) return NotFound("No valid trips found");

            var customerId = trips.First().Indent.CustomerId;

            decimal totalAmount = 0;
            foreach (var t in trips)
            {
                decimal rate = 0;
                if (request.CustomRates != null && request.CustomRates.TryGetValue(t.Id, out decimal customRate) && customRate > 0)
                {
                    rate = customRate;
                    t.CustomerRate = customRate;
                }
                else
                {
                    decimal addChargesSum = t.AdditionalCharges?.Sum(ac => ac.Amount) ?? 0;
                    rate = (t.CustomerRate ?? t.Indent?.CustomerRate ?? t.FreightCharges) + (t.TollCharges ?? 0) + addChargesSum;
                }
                totalAmount += rate;
            }

            decimal taxAmount = totalAmount * 0.18m; // 18% GST

            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                CustomerId = customerId,
                TotalAmount = totalAmount,
                TaxAmount = taxAmount,
                GrandTotal = totalAmount + taxAmount,
                DueDate = DateTime.UtcNow.AddDays(15),
                Status = "Unpaid"
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync(); // Save to get InvoiceId

            // Link trips to Invoice
            foreach (var trip in trips)
            {
                trip.InvoiceId = invoice.Id;
                _context.Entry(trip).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();
            return Ok(invoice);
        }

        // GET: api/Finance/invoices
        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(invoices);
        }
        
        // GET: api/Finance/invoices/{id}
        [HttpGet("invoices/{id}")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.Trips)
                .ThenInclude(t => t.Indent)
                .Include(i => i.Trips)
                .ThenInclude(t => t.Vehicle)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        // POST: api/Finance/invoices/{id}/pay
        [HttpPost("invoices/{id}/pay")]
        public async Task<IActionResult> MarkInvoiceAsPaid(int id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound("Invoice not found");

            invoice.Status = "Paid";
            _context.Entry(invoice).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Invoice marked as paid" });
        }
    }

    public class SettlePaymentRequest
    {
        public decimal Amount { get; set; }
        public string? UTRNumber { get; set; }
    }

    public class GenerateInvoiceRequest
    {
        public List<int> TripIds { get; set; } = new List<int>();
        public Dictionary<int, decimal>? CustomRates { get; set; }
    }
}
