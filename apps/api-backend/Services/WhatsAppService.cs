using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Services
{
    public class WhatsAppService : IWhatsAppService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<WhatsAppService> _logger;
        private readonly HttpClient _httpClient;

        public WhatsAppService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<WhatsAppService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _httpClient = new HttpClient();
        }

        public string NormalizePhoneNumber(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
            var digitsOnly = Regex.Replace(phone, @"\D", "");
            if (digitsOnly.Length == 10)
            {
                return "91" + digitsOnly; // Default to India (+91)
            }
            return digitsOnly;
        }

        public string GenerateWhatsAppShareUrl(string phoneNumber, string message)
        {
            var normalizedPhone = NormalizePhoneNumber(phoneNumber);
            var encodedText = UrlEncoder.Default.Encode(message);
            return $"https://wa.me/{normalizedPhone}?text={encodedText}";
        }

        public async Task<WhatsAppSendResult> SendMessageAsync(WhatsAppSendRequest request)
        {
            var normalizedPhone = NormalizePhoneNumber(request.PhoneNumber);
            if (string.IsNullOrEmpty(normalizedPhone))
            {
                return new WhatsAppSendResult
                {
                    Success = false,
                    Status = "Failed",
                    ErrorMessage = "Invalid or missing phone number."
                };
            }

            var shareUrl = GenerateWhatsAppShareUrl(normalizedPhone, request.Message);

            var ultraInstanceId = _configuration["WhatsApp:InstanceId"] ?? "instance191876";
            var ultraToken = _configuration["WhatsApp:Token"] ?? "dsclvk3g7h6j8bl4";

            var accessToken = _configuration["WhatsApp:AccessToken"] 
                ?? Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN");
            var phoneNumberId = _configuration["WhatsApp:PhoneNumberId"] 
                ?? Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID");

            string status = "Sent";
            string? externalMessageId = null;
            string? errorMessage = null;

            // 1. Direct Delivery via UltraMsg Gateway (No Facebook Required)
            if (!string.IsNullOrEmpty(ultraInstanceId) && !string.IsNullOrEmpty(ultraToken))
            {
                try
                {
                    var apiUrl = $"https://api.ultramsg.com/{ultraInstanceId}/messages/chat";
                    var formParams = new Dictionary<string, string>
                    {
                        { "token", ultraToken },
                        { "to", normalizedPhone.StartsWith("+") ? normalizedPhone : $"+{normalizedPhone}" },
                        { "body", request.Message }
                    };

                    var formContent = new FormUrlEncodedContent(formParams);
                    var response = await _httpClient.PostAsync(apiUrl, formContent);
                    var responseBody = await response.Content.ReadAsStringAsync();

                    _logger.LogInformation("UltraMsg WhatsApp response: {Body}", responseBody);

                    if (response.IsSuccessStatusCode)
                    {
                        using var doc = JsonDocument.Parse(responseBody);
                        if (doc.RootElement.TryGetProperty("id", out var idProp))
                        {
                            externalMessageId = idProp.ToString();
                        }
                        status = "Delivered";
                    }
                    else
                    {
                        _logger.LogWarning("UltraMsg WhatsApp API error: {Response}", responseBody);
                        status = "Failed";
                        errorMessage = responseBody;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to call UltraMsg WhatsApp API");
                    status = "Failed";
                    errorMessage = ex.Message;
                }
            }
            // 2. Direct Delivery via Meta WhatsApp Cloud API (Fallback)
            else if (!string.IsNullOrEmpty(accessToken) && !string.IsNullOrEmpty(phoneNumberId))
            {
                try
                {
                    var apiUrl = $"https://graph.facebook.com/v18.0/{phoneNumberId}/messages";
                    var payload = new
                    {
                        messaging_product = "whatsapp",
                        recipient_type = "individual",
                        to = normalizedPhone,
                        type = "text",
                        text = new { preview_url = true, body = request.Message }
                    };

                    var requestMessage = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                    requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                    requestMessage.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                    var response = await _httpClient.SendAsync(requestMessage);
                    var responseBody = await response.Content.ReadAsStringAsync();

                    if (response.IsSuccessStatusCode)
                    {
                        using var doc = JsonDocument.Parse(responseBody);
                        if (doc.RootElement.TryGetProperty("messages", out var msgs) && msgs.GetArrayLength() > 0)
                        {
                            externalMessageId = msgs[0].GetProperty("id").GetString();
                        }
                        status = "Delivered";
                    }
                    else
                    {
                        _logger.LogWarning("Meta WhatsApp API error: {Response}", responseBody);
                        status = "Failed";
                        errorMessage = responseBody;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to call WhatsApp Cloud API");
                    status = "Failed";
                    errorMessage = ex.Message;
                }
            }
            else
            {
                // Seamless Simulation & Direct Web Share mode
                status = "Sent";
                externalMessageId = $"sim_{Guid.NewGuid().ToString("N")[..10]}";
            }

            var log = new WhatsAppLog
            {
                PhoneNumber = normalizedPhone,
                RecipientName = request.RecipientName ?? "Contact",
                TemplateName = request.TemplateName ?? "custom",
                Message = request.Message,
                Status = status,
                ExternalMessageId = externalMessageId,
                SentAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _context.WhatsAppLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Could not persist WhatsApp log: {Message}", ex.Message);
            }

            return new WhatsAppSendResult
            {
                Success = status != "Failed",
                Status = status,
                ExternalMessageId = externalMessageId,
                ShareUrl = shareUrl,
                ErrorMessage = errorMessage,
                Log = log
            };
        }

        public async Task<WhatsAppSendResult> SendTripAssignedAsync(Trip trip, Driver? driver, Vehicle? vehicle, Indent? indent)
        {
            var phone = driver?.Phone;
            if (string.IsNullOrEmpty(phone))
            {
                return new WhatsAppSendResult { Success = false, Status = "Skipped", ErrorMessage = "Driver has no registered phone number." };
            }

            var driverName = driver?.Name ?? "Driver";
            var regNo = vehicle?.VehicleNumber ?? "Assigned Vehicle";
            var pickup = indent?.Source ?? "Source";
            var drop = indent?.Destination ?? "Destination";
            var lrNo = string.IsNullOrEmpty(trip.LRNumber) ? "Pending LR" : trip.LRNumber;
            var advance = trip.AdvanceAmount > 0 ? $"₹{trip.AdvanceAmount:N0}" : "₹0";

            var message = 
                $"🚛 *TransitFlow · Trip Assignment*\n\n" +
                $"Hello *{driverName}*,\n" +
                $"A new trip has been assigned to you:\n\n" +
                $"• *Trip ID:* TRIP-{trip.Id}\n" +
                $"• *Vehicle:* {regNo}\n" +
                $"• *Route:* {pickup} ➔ {drop}\n" +
                $"• *LR Number:* {lrNo}\n" +
                $"• *Advance Amount:* {advance}\n\n" +
                $"Please arrive at the loading point on time and report in TransitFlow Driver App.";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = phone,
                RecipientName = $"{driverName} (Driver)",
                TemplateName = "trip_assigned",
                Message = message,
                RelatedTripId = trip.Id
            });
        }

        public async Task<WhatsAppSendResult> SendDeliveryConfirmationAsync(Trip trip, Indent? indent, string recipientPhone, string? recipientName = null)
        {
            var drop = indent?.Destination ?? "Destination";
            var lrNo = string.IsNullOrEmpty(trip.LRNumber) ? $"TRIP-{trip.Id}" : trip.LRNumber;

            var message =
                $"✅ *TransitFlow · Consignment Delivered*\n\n" +
                $"Dear {recipientName ?? "Customer"},\n" +
                $"Consignment for *LR: {lrNo}* has safely arrived at *{drop}*.\n\n" +
                $"• *Trip ID:* TRIP-{trip.Id}\n" +
                $"• *Delivery Status:* Completed\n" +
                $"• *Delivered At:* {DateTime.UtcNow:dd MMM yyyy, hh:mm tt} UTC\n\n" +
                $"Proof of Delivery (POD) will be verified and uploaded shortly. Thank you for choosing TransitFlow!";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = recipientPhone,
                RecipientName = recipientName ?? "Customer Contact",
                TemplateName = "delivery_confirm",
                Message = message,
                RelatedTripId = trip.Id
            });
        }

        public async Task<WhatsAppSendResult> SendAdvanceDisbursedAsync(Trip trip, Driver? driver, decimal amount)
        {
            var phone = driver?.Phone;
            if (string.IsNullOrEmpty(phone)) return new WhatsAppSendResult { Success = false, Status = "Skipped" };

            var message =
                $"💰 *TransitFlow · Advance Payment Disbursed*\n\n" +
                $"Hello {driver?.Name ?? "Driver"},\n" +
                $"An advance amount of *₹{amount:N0}* for *Trip TRIP-{trip.Id}* has been approved and processed to your account.\n\n" +
                $"Please confirm receipt in the Driver app. Safe travels!";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = phone,
                RecipientName = $"{driver?.Name ?? "Driver"} (Driver)",
                TemplateName = "advance_disbursed",
                Message = message,
                RelatedTripId = trip.Id
            });
        }

        public async Task<WhatsAppSendResult> SendPodReminderAsync(Trip trip, Driver? driver)
        {
            var phone = driver?.Phone;
            if (string.IsNullOrEmpty(phone)) return new WhatsAppSendResult { Success = false, Status = "Skipped" };

            var baseUrl = GetFrontendBaseUrl();
            var uploadLink = !string.IsNullOrEmpty(trip.PODMagicLinkToken)
                ? $"{baseUrl}/pod/{trip.PODMagicLinkToken}"
                : $"{baseUrl}/trips/pod";

            var message =
                $"📸 *TransitFlow · Action Required: Upload POD*\n\n" +
                $"Hello {driver?.Name ?? "Driver"},\n" +
                $"Your trip *TRIP-{trip.Id}* has been marked as Delivered.\n\n" +
                $"👉 *Tap here to upload stamped POD photo:*\n{uploadLink}\n\n" +
                $"Please upload a clear photograph of the stamped physical Proof of Delivery (POD) to clear balance settlement.";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = phone,
                RecipientName = $"{driver?.Name ?? "Driver"} (Driver)",
                TemplateName = "pod_reminder",
                Message = message,
                RelatedTripId = trip.Id
            });
        }

        public async Task<WhatsAppSendResult> SendRfqBroadcastAsync(Indent indent, Vendor vendor, string? magicLinkToken = null)
        {
            var phone = vendor?.Phone;
            if (string.IsNullOrEmpty(phone)) return new WhatsAppSendResult { Success = false, Status = "Skipped", ErrorMessage = "Vendor has no registered phone number." };

            var vendorName = vendor?.Name ?? "Vendor Partner";
            var routeText = !string.IsNullOrEmpty(indent.WarehouseLocation)
                ? $"{indent.Source} ➔ {indent.WarehouseLocation} (Hub) ➔ {indent.Destination}"
                : $"{indent.Source} ➔ {indent.Destination}";
            var pickupDate = indent.LoadingDate != default ? indent.LoadingDate.ToString("dd MMM yyyy") : "Immediate / Scheduled";
            var reportingTime = !string.IsNullOrEmpty(indent.LoadingTime) ? indent.LoadingTime : "As Scheduled";

            var baseUrl = GetFrontendBaseUrl();
            var bidLink = !string.IsNullOrEmpty(magicLinkToken)
                ? $"{baseUrl}/bidding/{magicLinkToken}"
                : $"{baseUrl}/trips/procurement";

            var message =
                $"📢 *TransitFlow · New Load Enquiry / RFQ*\n\n" +
                $"Hello *{vendorName}*,\n" +
                $"We have a new load ready for vehicle placement:\n\n" +
                $"• *Indent Ref:* IND-{1000 + indent.Id}\n" +
                $"• *Route:* {routeText}\n" +
                $"• *Material:* {indent.Material} ({indent.Weight} Tons)\n" +
                $"• *Vehicle Required:* {indent.VehicleType}\n" +
                $"• *Pickup Date:* {pickupDate}\n" +
                $"• *Reporting Time:* {reportingTime}\n\n" +
                $"👉 *Tap to Submit Freight Quote (Mobile):*\n{bidLink}\n\n" +
                $"Or reply directly to this message with your best freight rate quote.";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = phone,
                RecipientName = $"{vendorName} (Vendor)",
                TemplateName = "rfq_broadcast",
                Message = message
            });
        }

        public async Task<WhatsAppSendResult> SendSalesQuotationAsync(SalesQuotation sq, Indent indent, Customer customer)
        {
            var phone = customer?.Phone;
            if (string.IsNullOrEmpty(phone)) return new WhatsAppSendResult { Success = false, Status = "Skipped", ErrorMessage = "Customer has no registered phone number." };

            var customerName = customer?.Name ?? "Valued Customer";
            var routeText = !string.IsNullOrEmpty(indent.WarehouseLocation)
                ? $"{indent.Source} ➔ {indent.WarehouseLocation} (Hub) ➔ {indent.Destination}"
                : $"{indent.Source} ➔ {indent.Destination}";
            var pickupDate = indent.LoadingDate != default ? indent.LoadingDate.ToString("dd MMM yyyy") : "Scheduled";

            var baseUrl = GetFrontendBaseUrl();
            var approvalLink = !string.IsNullOrEmpty(sq.MagicLinkToken)
                ? $"{baseUrl}/quotation/{sq.MagicLinkToken}"
                : $"{baseUrl}/trips/sales";

            var message =
                $"📋 *TransitFlow · Sales Quotation & Confirmation*\n\n" +
                $"Hello *{customerName}*,\n" +
                $"Here is the official quotation for your transport booking:\n\n" +
                $"• *Booking Ref:* IND-{1000 + indent.Id}\n" +
                $"• *Route:* {routeText}\n" +
                $"• *Cargo:* {indent.Material} ({indent.Weight} Tons)\n" +
                $"• *Vehicle:* {indent.VehicleType}\n" +
                $"• *Pickup Date:* {pickupDate}\n" +
                $"• *Agreed Freight Rate:* ₹{sq.SellingPrice:N0}\n\n" +
                $"👉 *Review & Confirm Booking (Mobile):*\n{approvalLink}\n\n" +
                $"Please enter your Purchase Order (PO) number via the link above or reply directly to confirm.";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = phone,
                RecipientName = $"{customerName} (Customer)",
                TemplateName = "sales_quotation",
                Message = message
            });
        }

        public async Task<WhatsAppSendResult> SendInvoiceCreatedAsync(Invoice invoice, Customer customer)
        {
            var phone = customer?.Phone;
            if (string.IsNullOrEmpty(phone)) return new WhatsAppSendResult { Success = false, Status = "Skipped", ErrorMessage = "Customer has no registered phone number." };

            var customerName = customer?.Name ?? "Valued Customer";
            var dueDate = invoice.DueDate.ToString("dd MMM yyyy");

            var baseUrl = GetFrontendBaseUrl();
            var invoiceLink = $"{baseUrl}/invoices/{invoice.Id}/pdf";

            var message =
                $"🧾 *TransitFlow · Tax Invoice Generated*\n\n" +
                $"Dear *{customerName}*,\n" +
                $"A new tax invoice has been generated for your recent consignments:\n\n" +
                $"• *Invoice No:* {invoice.InvoiceNumber}\n" +
                $"• *Net Amount:* ₹{invoice.TotalAmount:N0}\n" +
                $"• *GST (18%):* ₹{invoice.TaxAmount:N0}\n" +
                $"• *Grand Total:* ₹{invoice.GrandTotal:N0}\n" +
                $"• *Due Date:* {dueDate}\n\n" +
                $"👉 *View & Download Tax Invoice:*\n{invoiceLink}\n\n" +
                $"Kindly process payment by the due date. Thank you for partnering with TransitFlow!";

            return await SendMessageAsync(new WhatsAppSendRequest
            {
                PhoneNumber = phone,
                RecipientName = $"{customerName} (Customer)",
                TemplateName = "invoice_generated",
                Message = message
            });
        }

        public async Task<List<WhatsAppLog>> GetLogsAsync(int limit = 50)
        {
            return await _context.WhatsAppLogs
                .OrderByDescending(w => w.SentAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<WhatsAppConfigStatus> GetStatusAsync()
        {
            var ultraInstanceId = _configuration["WhatsApp:InstanceId"];
            var ultraToken = _configuration["WhatsApp:Token"];
            var accessToken = _configuration["WhatsApp:AccessToken"];
            var phoneNumberId = _configuration["WhatsApp:PhoneNumberId"];

            bool isUltra = !string.IsNullOrEmpty(ultraInstanceId) && !string.IsNullOrEmpty(ultraToken);
            bool isMeta = !string.IsNullOrEmpty(accessToken) && !string.IsNullOrEmpty(phoneNumberId);
            bool isLive = isUltra || isMeta;

            var totalSent = await _context.WhatsAppLogs.CountAsync(w => w.Status == "Sent" || w.Status == "Delivered");
            var totalDelivered = await _context.WhatsAppLogs.CountAsync(w => w.Status == "Delivered");
            var totalFailed = await _context.WhatsAppLogs.CountAsync(w => w.Status == "Failed");

            return new WhatsAppConfigStatus
            {
                IsLiveConfigured = isLive,
                Provider = isUltra ? $"UltraMsg Gateway ({ultraInstanceId} · Connected)" : isMeta ? "Meta WhatsApp Cloud API (Live)" : "WhatsApp Gateway (Simulated)",
                BusinessNumber = _configuration["WhatsApp:BusinessNumber"] ?? "+91 63602 74186",
                Mode = isLive ? "Direct Background Mobile Delivery" : "Simulation & Direct Web Share",
                TotalSent = totalSent,
                TotalDelivered = totalDelivered,
                TotalFailed = totalFailed
            };
        }

        private string GetFrontendBaseUrl()
        {
            // Environment variable (.env or host environment) acts as boss:
            return Environment.GetEnvironmentVariable("FRONTEND_BASE_URL")
                ?? _configuration["AppSettings:FrontendBaseUrl"]
                ?? "https://tms-saas-product.vercel.app";
        }
    }
}
