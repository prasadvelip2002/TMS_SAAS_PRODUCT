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
    public class IndentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IndentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Indents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Indent>>> GetIndents()
        {
            return await _context.Indents.Include(i => i.Customer).ToListAsync();
        }

        // GET: api/Indents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Indent>> GetIndent(int id)
        {
            var indent = await _context.Indents.Include(i => i.Customer).FirstOrDefaultAsync(i => i.Id == id);

            if (indent == null)
            {
                return NotFound();
            }

            return indent;
        }

        // POST: api/Indents
        [HttpPost]
        public async Task<ActionResult<Indent>> PostIndent(Indent indent)
        {
            _context.Indents.Add(indent);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIndent), new { id = indent.Id }, indent);
        }

        // PUT: api/Indents/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutIndent(int id, Indent indent)
        {
            if (id != indent.Id)
            {
                return BadRequest();
            }

            var existingIndent = await _context.Indents.FindAsync(id);
            if (existingIndent == null)
            {
                return NotFound();
            }

            // Update properties
            existingIndent.CustomerId = indent.CustomerId;
            existingIndent.Source = indent.Source;
            existingIndent.Destination = indent.Destination;
            existingIndent.Material = indent.Material;
            existingIndent.Weight = indent.Weight;
            existingIndent.VehicleType = indent.VehicleType;
            existingIndent.LoadingDate = indent.LoadingDate;
            existingIndent.Status = indent.Status;
            existingIndent.PricingModel = indent.PricingModel;
            existingIndent.CustomerRate = indent.CustomerRate;
            existingIndent.DestinationsJson = indent.DestinationsJson;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IndentExists(id))
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

        // DELETE: api/Indents/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIndent(int id)
        {
            var indent = await _context.Indents.FindAsync(id);
            if (indent == null)
            {
                return NotFound();
            }

            _context.Indents.Remove(indent);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool IndentExists(int id)
        {
            return _context.Indents.Any(e => e.Id == id);
        }
    }
}

