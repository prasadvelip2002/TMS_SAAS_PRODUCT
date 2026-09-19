using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppController : ControllerBase
    {
        private readonly IWhatsAppService _whatsAppService;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public WhatsAppController(
            IWhatsAppService whatsAppService,
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _whatsAppService = whatsAppService;
            _context = context;
            _configuration = configuration;
        }

        // GET: api/WhatsApp/status
        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> GetStatus()
        {
            var status = await _whatsAppService.GetStatusAsync();
            return Ok(status);
        }

        // GET: api/WhatsApp/logs
        [HttpGet("logs")]
        [Authorize]
        public async Task<IActionResult> GetLogs([FromQuery] int limit = 50)
        {
            var logs = await _whatsAppService.GetLogsAsync(limit);
            return Ok(logs);
        }

        // POST: api/WhatsApp/send
        [HttpPost("send")]
        [Authorize]
        public async Task<IActionResult> SendMessage([FromBody] WhatsAppSendRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "PhoneNumber and Message are required." });
            }

            var result = await _whatsAppService.SendMessageAsync(request);
            if (!result.Success && result.Status == "Failed")
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // POST: api/WhatsApp/trip/{id}/notify-driver
        [HttpPost("trip/{id}/notify-driver")]
        [Authorize]
        public async Task<IActionResult> NotifyDriver(int id)
        {
            var trip = await _context.Trips
                .Include(t => t.Driver)
                .Include(t => t.Vehicle)
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trip == null) return NotFound(new { message = "Trip not found." });
            if (trip.Driver == null || string.IsNullOrWhiteSpace(trip.Driver.Phone))
            {
                return BadRequest(new { message = "No assigned driver or driver phone number found." });
            }

            var result = await _whatsAppService.SendTripAssignedAsync(trip, trip.Driver, trip.Vehicle, trip.Indent);
            return Ok(result);
        }

        // GET: api/WhatsApp/share-link
        [HttpGet("share-link")]
        [Authorize]
        public IActionResult GetShareLink([FromQuery] string phone, [FromQuery] string message)
        {
            if (string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(message))
            {
                return BadRequest(new { message = "Phone and message are required." });
            }

            var link = _whatsAppService.GenerateWhatsAppShareUrl(phone, message);
            return Ok(new { shareUrl = link });
        }

        // GET: api/WhatsApp/webhook (Meta verification handshake)
        [HttpGet("webhook")]
        [AllowAnonymous]
        public IActionResult VerifyWebhook(
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.verify_token")] string? token,
            [FromQuery(Name = "hub.challenge")] string? challenge)
        {
            var verifyToken = _configuration["WhatsApp:WebhookVerifyToken"] ?? "TRANSITFLOW_WA_VERIFY_2026";
            if (mode == "subscribe" && token == verifyToken)
            {
                return Ok(challenge);
            }
            return Forbid();
        }

        // POST: api/WhatsApp/webhook (Incoming events)
        [HttpPost("webhook")]
        [AllowAnonymous]
        public IActionResult HandleWebhook([FromBody] object payload)
        {
            // Acknowledge Meta webhook quickly with 200 OK
            return Ok(new { status = "received" });
        }
    }
}
