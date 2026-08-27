using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Services
{
    public class LocalDocumentService : IDocumentService
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;

        public LocalDocumentService(IWebHostEnvironment env, ApplicationDbContext context)
        {
            _env = env;
            _context = context;
        }

        public async Task<Document> UploadDocumentAsync(IFormFile file, string entityType, int entityId, string documentType)
        {
            if (file == null || file.Length == 0)
                throw new Exception("No file provided.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{uniqueFileName}";

            var document = new Document
            {
                EntityType = entityType,
                EntityId = entityId,
                DocumentType = documentType,
                FileUrl = fileUrl,
                CreatedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);

            // Update Trip PODUploadedDate if applicable
            if (entityType == "Trip" && documentType == "POD")
            {
                var trip = await _context.Trips.FindAsync(entityId);
                if (trip != null && trip.PODUploadedDate == null)
                {
                    trip.PODUploadedDate = DateTime.UtcNow;
                    _context.Trips.Update(trip);
                }
            }

            await _context.SaveChangesAsync();

            return document;
        }
    }
}
