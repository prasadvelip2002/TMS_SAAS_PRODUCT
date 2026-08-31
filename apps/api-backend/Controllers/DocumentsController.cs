using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDocumentService _documentService;

        public DocumentsController(ApplicationDbContext context, IDocumentService documentService)
        {
            _context = context;
            _documentService = documentService;
        }

        // POST: api/Documents/Upload
        [HttpPost("Upload")]
        public async Task<ActionResult<Document>> UploadDocument([FromForm] IFormFile file, [FromForm] string entityType, [FromForm] int entityId, [FromForm] string documentType)
        {
            try
            {
                var doc = await _documentService.UploadDocumentAsync(file, entityType, entityId, documentType);
                return Ok(doc);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/Documents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments()
        {
            return await _context.Documents.ToListAsync();
        }

        // GET: api/Documents/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);

            if (document == null)
            {
                return NotFound();
            }

            return document;
        }

        // GET: api/Documents/trip/{tripId}
        [HttpGet("trip/{tripId}")]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocumentsByTrip(int tripId)
        {
            return await _context.Documents
                .Where(d => (d.EntityType == "Trip" || d.EntityType == "POD") && d.EntityId == tripId)
                .ToListAsync();
        }

        // POST: api/Documents
        [HttpPost]
        public async Task<ActionResult<Document>> PostDocument(Document document)
        {
            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, document);
        }

        // PUT: api/Documents/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDocument(int id, Document document)
        {
            if (id != document.Id)
            {
                return BadRequest();
            }

            _context.Entry(document).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DocumentExists(id))
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

        // DELETE: api/Documents/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(int id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound();
            }

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DocumentExists(int id)
        {
            return _context.Documents.Any(e => e.Id == id);
        }

        // GET: api/Documents/pod/{token}
        [HttpGet("pod/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTripByPODToken(string token)
        {
            var trip = await _context.Trips
                .Include(t => t.Indent)
                .ThenInclude(i => i.Customer)
                .Include(t => t.Vehicle)
                .FirstOrDefaultAsync(t => t.PODMagicLinkToken == token);

            if (trip == null) return NotFound("Invalid or expired POD link.");

            return Ok(new {
                tripId = trip.Id,
                customer = trip.Indent?.Customer?.Name,
                source = trip.Indent?.Source,
                destination = trip.Indent?.Destination,
                vehicle = trip.Vehicle?.VehicleNumber,
                status = trip.Status,
                isAlreadyUploaded = trip.PODUploadedDate != null
            });
        }

        // POST: api/Documents/pod/submit/{token}
        [HttpPost("pod/submit/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitPOD(string token, [FromBody] SubmitPODRequest request)
        {
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.PODMagicLinkToken == token);
            if (trip == null) return NotFound("Invalid token.");

            // Create Document record
            var doc = new Document
            {
                EntityType = "POD",
                EntityId = trip.Id,
                DocumentType = "DeliveryReceipt",
                FileUrl = request.FileUrl,
                TenantId = trip.TenantId
            };
            _context.Documents.Add(doc);

            // Update Trip
            trip.PODUploadedDate = System.DateTime.UtcNow;
            trip.Status = "Delivered";
            _context.Entry(trip).State = EntityState.Modified;

            await _context.SaveChangesAsync();
            return Ok(new { message = "POD submitted successfully" });
        }

        // POST: api/Documents/pod/approve/{tripId}
        [HttpPost("pod/approve/{tripId}")]
        public async Task<IActionResult> ApprovePOD(int tripId)
        {
            var trip = await _context.Trips.FindAsync(tripId);
            if (trip == null) return NotFound();

            trip.PODReceivedDate = System.DateTime.UtcNow;
            // Trip is now closed for billing
            trip.Status = "Closed";
            _context.Entry(trip).State = EntityState.Modified;

            await _context.SaveChangesAsync();
            return Ok(new { message = "POD approved and Trip Closed" });
        }
    }

    public class SubmitPODRequest
    {
        public string FileUrl { get; set; } = string.Empty;
    }
}

