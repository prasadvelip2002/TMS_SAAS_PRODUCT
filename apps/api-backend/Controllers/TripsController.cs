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
    public class TripsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ITripService _tripService;

        public TripsController(ApplicationDbContext context, ITripService tripService)
        {
            _context = context;
            _tripService = tripService;
        }

        // POST: api/Trips/Assign
        [HttpPost("assign")]
        public async Task<IActionResult> AssignTrip([FromBody] AssignTripRequest request)
        {
            try
            {
                var trip = await _tripService.AssignTripAsync(request);
                return Ok(trip);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/Trips/5/Status
        [HttpPost("{id}/Status")]
        public async Task<IActionResult> UpdateTripStatus(int id, UpdateTripStatusRequest request)
        {
            try
            {
                var trip = await _tripService.UpdateTripStatusAsync(id, request.Status);
                return Ok(trip);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // POST: api/Trips/5/create-outbound-leg
        [HttpPost("{id}/create-outbound-leg")]
        public async Task<IActionResult> CreateOutboundLeg(int id)
        {
            var leg1Trip = await _context.Trips
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (leg1Trip == null)
            {
                return NotFound(new { message = "Leg 1 Trip not found." });
            }

            var leg2Trip = new Trip
            {
                IndentId = leg1Trip.IndentId,
                LegType = "OutboundLeg2",
                ParentTripId = leg1Trip.Id,
                Status = "Pending Assignment",
                TenantId = leg1Trip.TenantId,
                CompanyId = leg1Trip.CompanyId,
                VendorId = leg1Trip.VendorId,
                LRGenerationType = leg1Trip.LRGenerationType,
                BookingType = leg1Trip.BookingType,
                RatePerTon = leg1Trip.RatePerTon,
                FixedRate = leg1Trip.FixedRate
            };

            _context.Trips.Add(leg2Trip);

            if (leg1Trip.LegType == "Direct")
            {
                leg1Trip.LegType = "InboundLeg1";
                _context.Entry(leg1Trip).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();

            return Ok(leg2Trip);
        }

        // GET: api/Trips
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Trip>>> GetTrips()
        {
            return await _context.Trips
                .Include(t => t.Indent)
                    .ThenInclude(i => i.Customer)
                .Include(t => t.Vendor)
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Payments)
                .Include(t => t.Invoice)
                .ToListAsync();
        }

        // GET: api/Trips/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Trip>> GetTrip(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Indent)
                    .ThenInclude(i => i.Customer)
                .Include(t => t.Vendor)
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null)
            {
                return NotFound();
            }

            return trip;
        }

        // POST: api/Trips
        [HttpPost]
        public async Task<ActionResult<Trip>> PostTrip(Trip trip)
        {
            _context.Trips.Add(trip);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTrip), new { id = trip.Id }, trip);
        }

        // PUT: api/Trips/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTrip(int id, Trip trip)
        {
            if (id != trip.Id)
            {
                return BadRequest();
            }

            _context.Entry(trip).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TripExists(id))
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

        // DELETE: api/Trips/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTrip(int id)
        {
            var trip = await _context.Trips.FindAsync(id);
            if (trip == null)
            {
                return NotFound();
            }

            _context.Trips.Remove(trip);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TripExists(int id)
        {
            return _context.Trips.Any(e => e.Id == id);
        }
    }
}

