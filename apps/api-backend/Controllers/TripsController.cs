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

        // POST: api/Trips/5/generate-lr
        [HttpPost("{id}/generate-lr")]
        public async Task<IActionResult> GenerateLR(int id)
        {
            var trip = await _context.Trips.FindAsync(id);
            if (trip == null) return NotFound();

            trip.LRGenerationType = "System";
            trip.LRNumber = $"TRANSITFLOW-LR-{trip.Id.ToString().PadLeft(4, '0')}";
            
            await _context.SaveChangesAsync();
            return Ok(trip);
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

            // Check if Outbound Leg 2 already exists
            var existingLeg2 = await _context.Trips
                .Include(t => t.Indent)
                .Include(t => t.Vendor)
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .FirstOrDefaultAsync(t => t.ParentTripId == leg1Trip.Id || (t.IndentId == leg1Trip.IndentId && t.LegType == "OutboundLeg2"));

            if (existingLeg2 != null)
            {
                return Ok(existingLeg2);
            }

            if (leg1Trip.LegType == "Direct")
            {
                leg1Trip.LegType = "InboundLeg1";
            }
            // Single Invoice: Leg 1 is internal transfer (CustomerRate = 0),
            // while Leg 2 holds the customer agreed master rate.
            leg1Trip.CustomerRate = 0;
            _context.Entry(leg1Trip).State = EntityState.Modified;

            var leg2Trip = new Trip
            {
                IndentId = leg1Trip.IndentId,
                LegType = "OutboundLeg2",
                ParentTripId = leg1Trip.Id,
                Status = "Pending Assignment",
                TenantId = leg1Trip.TenantId,
                CompanyId = leg1Trip.CompanyId,
                VehicleId = null,
                DriverId = null,
                VendorId = null,
                LRGenerationType = "System",
                BookingType = leg1Trip.BookingType ?? "Fixed",
                RatePerTon = 0,
                FixedRate = 0,
                FreightCharges = 0,
                AdvanceAmount = 0,
                BalanceAmount = 0,
                SupplierRate = 0,
                CustomerRate = leg1Trip.Indent?.CustomerRate
            };

            _context.Trips.Add(leg2Trip);
            await _context.SaveChangesAsync();

            return Ok(leg2Trip);
        }

        // GET: api/Trips
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Trip>>> GetTrips()
        {
            var trips = await _context.Trips
                .AsNoTracking()
                .AsSplitQuery()
                .Include(t => t.Indent)
                    .ThenInclude(i => i.Customer)
                .Include(t => t.Vendor)
                .Include(t => t.Vehicle)
                .Include(t => t.Driver)
                .Include(t => t.Payments)
                .Include(t => t.Invoice)
                .ToListAsync();

            if (User.IsInRole("Driver"))
            {
                foreach (var trip in trips)
                {
                    if (trip.SupplierPaymentTo != "Driver")
                    {
                        trip.SupplierRate = null;
                        trip.CustomerRate = null;
                        trip.FreightCharges = 0;
                        trip.FixedRate = 0;
                        trip.RatePerTon = 0;
                        // Only show what is explicitly meant for the driver
                        trip.AdvanceAmount = trip.FuelAdvance ?? 0;
                    }
                }
            }

            return trips;
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

            if (User.IsInRole("Driver") && trip.SupplierPaymentTo != "Driver")
            {
                trip.SupplierRate = null;
                trip.CustomerRate = null;
                trip.FreightCharges = 0;
                trip.FixedRate = 0;
                trip.RatePerTon = 0;
                trip.AdvanceAmount = trip.FuelAdvance ?? 0;
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

