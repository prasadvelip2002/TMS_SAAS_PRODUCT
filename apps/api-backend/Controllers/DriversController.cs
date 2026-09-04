using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class DriversController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DriversController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Drivers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers([FromQuery] bool? isOwnFleet)
        {
            var query = _context.Drivers.Include(d => d.Vendor).AsQueryable();
            if (isOwnFleet.HasValue)
            {
                if (isOwnFleet.Value)
                {
                    query = query.Where(d => d.VendorId == null);
                }
                else
                {
                    query = query.Where(d => d.VendorId != null);
                }
            }
            return await query.ToListAsync();
        }

        // GET: api/Drivers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Driver>> GetDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);

            if (driver == null)
            {
                return NotFound();
            }

            return driver;
        }

        // POST: api/Drivers
        [HttpPost]
        public async Task<ActionResult<Driver>> PostDriver(Driver driver)
        {
            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDriver), new { id = driver.Id }, driver);
        }

        // PUT: api/Drivers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDriver(int id, Driver driver)
        {
            if (id != driver.Id)
            {
                return BadRequest();
            }

            var existingDriver = await _context.Drivers.FindAsync(id);
            if (existingDriver == null)
            {
                return NotFound();
            }
            
            existingDriver.Name = driver.Name;
            existingDriver.Phone = driver.Phone;
            existingDriver.LicenseNumber = driver.LicenseNumber;
            existingDriver.LicenseExpiry = driver.LicenseExpiry;
            existingDriver.Aadhaar = driver.Aadhaar;
            existingDriver.ExperienceYears = driver.ExperienceYears;
            existingDriver.CurrentStatus = driver.CurrentStatus;
            existingDriver.VendorId = driver.VendorId;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DriverExists(id))
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

        // DELETE: api/Drivers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null)
            {
                return NotFound();
            }

            _context.Drivers.Remove(driver);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DriverExists(int id)
        {
            return _context.Drivers.Any(e => e.Id == id);
        }

        [HttpPost("fix-vendors")]
        [AllowAnonymous]
        public async Task<IActionResult> FixVendors()
        {
            var vendor = await _context.Vendors.FirstOrDefaultAsync();
            if (vendor == null) return NotFound("No vendors exist.");

            var drivers = await _context.Drivers.Where(d => d.VendorId == null).ToListAsync();
            foreach (var d in drivers) d.VendorId = vendor.Id;

            var vehicles = await _context.Vehicles.Where(v => v.VendorId == null).ToListAsync();
            foreach (var v in vehicles) v.VendorId = vendor.Id;

            await _context.SaveChangesAsync();
            return Ok($"Assigned {drivers.Count} drivers and {vehicles.Count} vehicles to vendor {vendor.Name}.");
        }
    }
}

