using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITripService _tripService;
        private readonly IWhatsAppService _whatsAppService;

        public PaymentsController(ApplicationDbContext context, ITripService tripService, IWhatsAppService whatsAppService)
        {
            _context = context;
            _tripService = tripService;
            _whatsAppService = whatsAppService;
        }

        // GET: api/Payments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments()
        {
            return await _context.Payments.Include(p => p.Trip).ToListAsync();
        }

        // GET: api/Payments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            var payment = await _context.Payments.Include(p => p.Trip).FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null)
            {
                return NotFound();
            }

            return payment;
        }

        // POST: api/Payments
        [HttpPost]
        public async Task<ActionResult<Payment>> PostPayment(Payment payment)
        {
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            await _tripService.RecalculateBalanceAsync(payment.TripId);

            // Automated dynamic UltraMsg WhatsApp dispatch for Advance or Driver Payment
            try
            {
                if (payment.Type == "Advance" || payment.BeneficiaryType == "Driver")
                {
                    var trip = await _context.Trips
                        .Include(t => t.Driver)
                        .FirstOrDefaultAsync(t => t.Id == payment.TripId);

                    if (trip?.Driver != null && !string.IsNullOrEmpty(trip.Driver.Phone))
                    {
                        await _whatsAppService.SendAdvanceDisbursedAsync(trip, trip.Driver, payment.Amount);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WhatsApp Payment Dispatch Error]: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
        }

        // PUT: api/Payments/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPayment(int id, Payment payment)
        {
            if (id != payment.Id)
            {
                return BadRequest();
            }

            _context.Entry(payment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Payments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymentExists(int id)
        {
            return _context.Payments.Any(e => e.Id == id);
        }
    }
}

