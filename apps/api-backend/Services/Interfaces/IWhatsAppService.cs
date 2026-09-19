using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using api_backend.Models;

namespace api_backend.Services.Interfaces
{
    public class WhatsAppSendRequest
    {
        public required string PhoneNumber { get; set; }
        public string? RecipientName { get; set; }
        public string? TemplateName { get; set; } = "custom";
        public required string Message { get; set; }
        public int? RelatedTripId { get; set; }
    }

    public class WhatsAppSendResult
    {
        public bool Success { get; set; }
        public string? Status { get; set; }
        public string? ExternalMessageId { get; set; }
        public string? ShareUrl { get; set; }
        public string? ErrorMessage { get; set; }
        public WhatsAppLog? Log { get; set; }
    }

    public class WhatsAppConfigStatus
    {
        public bool IsLiveConfigured { get; set; }
        public string Provider { get; set; } = "Meta Cloud API";
        public string BusinessNumber { get; set; } = "+91 98765 43210";
        public string Mode { get; set; } = "Simulation & Direct Web Share";
        public int TotalSent { get; set; }
        public int TotalDelivered { get; set; }
        public int TotalFailed { get; set; }
    }

    public interface IWhatsAppService
    {
        Task<WhatsAppSendResult> SendMessageAsync(WhatsAppSendRequest request);
        Task<WhatsAppSendResult> SendTripAssignedAsync(Trip trip, Driver? driver, Vehicle? vehicle, Indent? indent);
        Task<WhatsAppSendResult> SendDeliveryConfirmationAsync(Trip trip, Indent? indent, string recipientPhone, string? recipientName = null);
        Task<WhatsAppSendResult> SendAdvanceDisbursedAsync(Trip trip, Driver? driver, decimal amount);
        Task<WhatsAppSendResult> SendPodReminderAsync(Trip trip, Driver? driver);
        Task<WhatsAppSendResult> SendRfqBroadcastAsync(Indent indent, Vendor vendor, string? magicLinkToken = null);
        Task<WhatsAppSendResult> SendSalesQuotationAsync(SalesQuotation sq, Indent indent, Customer customer);
        Task<WhatsAppSendResult> SendInvoiceCreatedAsync(Invoice invoice, Customer customer);
        string GenerateWhatsAppShareUrl(string phoneNumber, string message);
        Task<List<WhatsAppLog>> GetLogsAsync(int limit = 50);
        Task<WhatsAppConfigStatus> GetStatusAsync();
    }
}
