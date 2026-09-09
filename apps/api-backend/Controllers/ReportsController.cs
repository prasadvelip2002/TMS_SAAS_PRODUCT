using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("trips")]
        public async Task<IActionResult> GetTripReport()
        {
            var trips = await _context.Trips
                .AsNoTracking()
                .Include(t => t.Indent)
                    .ThenInclude(i => i.Customer)
                .Include(t => t.Vendor)
                .Include(t => t.Vehicle)
                .Include(t => t.AdditionalCharges)
                .Include(t => t.Invoice)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var indentIds = trips.Select(t => t.IndentId).Distinct().ToList();
            var tripIds = trips.Select(t => t.Id).ToList();

            var sqs = await _context.SalesQuotations
                .AsNoTracking()
                .Include(s => s.WinningVendorQuotation)
                .Where(s => (s.TripId.HasValue && tripIds.Contains(s.TripId.Value)) || indentIds.Contains(s.IndentId))
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var result = trips.Select(t =>
            {
                var sq = sqs.FirstOrDefault(s => s.TripId == t.Id)
                      ?? sqs.FirstOrDefault(s => s.IndentId == t.IndentId && (s.Status == "Approved" || s.Status == "PO_Received"))
                      ?? sqs.FirstOrDefault(s => s.IndentId == t.IndentId);

                bool isOwnFleet = (t.VendorId == null || t.Vendor?.Name == "Own Fleet" || (t.LegType == "Direct" && t.VendorId == null));

                bool isContract = false;
                if (t.Indent != null)
                {
                    if (t.Indent.PricingModel == "CaseToCase")
                    {
                        isContract = false;
                    }
                    else if (t.Indent.PricingModel == "AnnualContract")
                    {
                        isContract = true;
                    }
                    else if (t.Indent.Customer != null && t.Indent.Customer.CustomerType == "Spot")
                    {
                        isContract = false;
                    }
                    else if (t.Indent.Customer != null && (t.Indent.Customer.CustomerType == "Contract" || (!string.IsNullOrEmpty(t.Indent.Customer.RateContract) && t.Indent.Customer.RateContract != "Draft")))
                    {
                        isContract = true;
                    }
                }

                string pricingModel = isContract ? "Contract" : "Spot";

                decimal customerRate = sq != null && sq.SellingPrice > 0
                    ? sq.SellingPrice
                    : (t.CustomerRate ?? t.Indent?.CustomerRate ?? t.FreightCharges);

                var breakdown = new List<ExtraExpenseItem>();

                // Parse CostBreakdownJson if stored
                string? costJson = !string.IsNullOrWhiteSpace(t.CostBreakdownJson) ? t.CostBreakdownJson : sq?.CostBreakdownJson;
                bool hasCostSheetJson = false;

                if (!string.IsNullOrWhiteSpace(costJson))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(costJson);
                        var root = doc.RootElement;
                        hasCostSheetJson = true;

                        if (root.TryGetProperty("fuel", out var fuelProp) && fuelProp.GetDecimal() > 0)
                            breakdown.Add(new ExtraExpenseItem { Title = "Fuel (Diesel)", Amount = fuelProp.GetDecimal(), Source = "Sales Cost Sheet" });

                        decimal driverDays = root.TryGetProperty("driverDays", out var ddProp) ? ddProp.GetDecimal() : 0;
                        decimal driverDailyWage = root.TryGetProperty("driverDailyWage", out var dwProp) ? dwProp.GetDecimal() : 0;
                        if (driverDays > 0 && driverDailyWage > 0)
                        {
                            breakdown.Add(new ExtraExpenseItem { 
                                Title = $"Driver Wages ({driverDays}d @ ₹{driverDailyWage})", 
                                Amount = driverDays * driverDailyWage, 
                                Source = "Sales Cost Sheet" 
                            });
                        }

                        if (root.TryGetProperty("driverAllowance", out var daProp) && daProp.GetDecimal() > 0)
                            breakdown.Add(new ExtraExpenseItem { Title = "Driver Bata / Allowance", Amount = daProp.GetDecimal(), Source = "Sales Cost Sheet" });

                        if (root.TryGetProperty("foodAllowance", out var faProp) && faProp.GetDecimal() > 0)
                            breakdown.Add(new ExtraExpenseItem { Title = "Food Allowance", Amount = faProp.GetDecimal(), Source = "Sales Cost Sheet" });

                        if (root.TryGetProperty("toll", out var tollProp) && tollProp.GetDecimal() > 0)
                            breakdown.Add(new ExtraExpenseItem { Title = "Toll Charges", Amount = tollProp.GetDecimal(), Source = "Sales Cost Sheet" });

                        if (root.TryGetProperty("loading", out var loadProp) && loadProp.GetDecimal() > 0)
                            breakdown.Add(new ExtraExpenseItem { Title = "Loading Charges", Amount = loadProp.GetDecimal(), Source = "Sales Cost Sheet" });

                        if (root.TryGetProperty("unloading", out var unloadProp) && unloadProp.GetDecimal() > 0)
                            breakdown.Add(new ExtraExpenseItem { Title = "Unloading Charges", Amount = unloadProp.GetDecimal(), Source = "Sales Cost Sheet" });

                        decimal otherAmount = root.TryGetProperty("otherAmount", out var oaProp) ? oaProp.GetDecimal() : 0;
                        string otherDesc = root.TryGetProperty("otherDescription", out var odProp) ? odProp.GetString() ?? "" : "";
                        if (otherAmount > 0)
                        {
                            breakdown.Add(new ExtraExpenseItem { 
                                Title = !string.IsNullOrWhiteSpace(otherDesc) ? otherDesc : "Miscellaneous Route Expense", 
                                Amount = otherAmount, 
                                Source = "Sales Cost Sheet" 
                            });
                        }
                    }
                    catch
                    {
                        hasCostSheetJson = false;
                    }
                }

                // If Own Fleet and no JSON was present, but sq.BaseRate > 0 (sales operating expenses)
                if (isOwnFleet && !hasCostSheetJson && sq != null && sq.BaseRate > 0)
                {
                    breakdown.Add(new ExtraExpenseItem {
                        Title = "Fleet Operating Expenses (Sales Cost Sheet)",
                        Amount = sq.BaseRate,
                        Source = "Sales Cost Sheet",
                        Description = "Fuel, driver wages, toll & route operating expenses"
                    });
                }

                // Add approved AdditionalCharges recorded on the trip
                if (t.AdditionalCharges != null)
                {
                    foreach (var ac in t.AdditionalCharges.Where(a => a.Status == "Approved"))
                    {
                        breakdown.Add(new ExtraExpenseItem {
                            Title = $"{ac.ChargeType} (Route Charge)",
                            Amount = ac.Amount,
                            Source = "Approved Additional Charge",
                            Description = ac.Description ?? "Approved on-road trip charge"
                        });
                    }
                }

                decimal extraCharges = breakdown.Sum(b => b.Amount);
                decimal supplierRate = 0m;
                decimal fuelAdvance = t.FuelAdvance ?? 0m;
                decimal tollCharges = t.TollCharges ?? 0m;
                decimal totalCost = 0m;
                decimal margin = 0m;
                decimal salesMargin = sq?.Margin ?? 0m;

                if (isOwnFleet)
                {
                    supplierRate = 0m;
                    totalCost = extraCharges;
                    margin = customerRate - totalCost;
                }
                else
                {
                    supplierRate = (t.SupplierRate.HasValue && t.SupplierRate.Value > 0)
                        ? t.SupplierRate.Value
                        : (sq?.WinningVendorQuotation?.QuotedRate ?? sq?.BaseRate ?? 0m);

                    totalCost = supplierRate + extraCharges + fuelAdvance + tollCharges;
                    margin = customerRate - totalCost;
                }

                return new
                {
                    TripId = "TRP-" + (1000 + t.Id),
                    Date = t.CreatedAt,
                    CustomerName = t.Indent != null && t.Indent.Customer != null ? t.Indent.Customer.Name : "N/A",
                    Source = t.Indent != null ? t.Indent.Source : "N/A",
                    WarehouseLocation = t.Indent != null ? t.Indent.WarehouseLocation : null,
                    Destination = t.Indent != null ? t.Indent.Destination : "N/A",
                    LegType = t.LegType,
                    Material = t.Indent != null ? t.Indent.Material : "General Freight",
                    Weight = t.Indent != null ? t.Indent.Weight : 0m,
                    Vehicle = t.Vehicle != null ? t.Vehicle.VehicleNumber : "N/A",
                    VendorName = t.Vendor != null ? t.Vendor.Name : (isOwnFleet ? "Own Fleet" : "N/A"),
                    Status = t.Status,
                    InvoiceNumber = t.Invoice != null ? t.Invoice.InvoiceNumber : null,
                    IsBilled = t.InvoiceId != null,
                    IsVendorSettled = t.IsVendorSettled,
                    IsOwnFleet = isOwnFleet,
                    PricingModel = pricingModel,
                    CustomerRate = customerRate,
                    SupplierRate = supplierRate,
                    FuelAdvance = fuelAdvance,
                    TollCharges = tollCharges,
                    ExtraCharges = extraCharges,
                    TotalCost = totalCost,
                    Margin = margin,
                    SalesMargin = salesMargin,
                    ExtraChargesBreakdown = breakdown
                };
            }).ToList();

            return Ok(result);
        }
    }

    public class ExtraExpenseItem
    {
        public string Title { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Source { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
