using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System.Linq;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class AdditionalChargesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdditionalChargesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/AdditionalCharges
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdditionalCharge>>> GetAdditionalCharges()
        {
            return await _context.AdditionalCharges
                .Include(c => c.Trip)
                    .ThenInclude(t => t.Indent)
                        .ThenInclude(i => i.Customer)
                .Include(c => c.Trip)
                    .ThenInclude(t => t.Vendor)
                .Include(c => c.Trip)
                    .ThenInclude(t => t.Vehicle)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        // GET: api/AdditionalCharges/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AdditionalCharge>> GetAdditionalCharge(int id)
        {
            var charge = await _context.AdditionalCharges
                .Include(c => c.Trip)
                    .ThenInclude(t => t.Indent)
                        .ThenInclude(i => i.Customer)
                .Include(c => c.Trip)
                    .ThenInclude(t => t.Vendor)
                .Include(c => c.Trip)
                    .ThenInclude(t => t.Vehicle)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (charge == null)
            {
                return NotFound();
            }

            return charge;
        }

        // POST: api/AdditionalCharges
        [HttpPost]
        public async Task<ActionResult<AdditionalCharge>> PostAdditionalCharge(AdditionalCharge charge)
        {
            if (string.IsNullOrEmpty(charge.Status))
            {
                charge.Status = "Approved";
            }
            _context.AdditionalCharges.Add(charge);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAdditionalCharge), new { id = charge.Id }, charge);
        }

        // POST: api/AdditionalCharges/5/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveAdditionalCharge(int id)
        {
            var charge = await _context.AdditionalCharges.FindAsync(id);
            if (charge == null) return NotFound("Additional charge not found");

            charge.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Additional charge approved successfully", charge });
        }

        // POST: api/AdditionalCharges/5/reject
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectAdditionalCharge(int id)
        {
            var charge = await _context.AdditionalCharges.FindAsync(id);
            if (charge == null) return NotFound("Additional charge not found");

            charge.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Additional charge rejected", charge });
        }

        // PUT: api/AdditionalCharges/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAdditionalCharge(int id, AdditionalCharge charge)
        {
            if (id != charge.Id)
            {
                return BadRequest();
            }

            _context.Entry(charge).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AdditionalChargeExists(id))
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

        // DELETE: api/AdditionalCharges/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAdditionalCharge(int id)
        {
            var charge = await _context.AdditionalCharges.FindAsync(id);
            if (charge == null)
            {
                return NotFound();
            }

            _context.AdditionalCharges.Remove(charge);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AdditionalChargeExists(int id)
        {
            return _context.AdditionalCharges.Any(e => e.Id == id);
        }
    }
}
