using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using api_backend.Services.Interfaces;

namespace api_backend.Services
{
    public class TripService : ITripService
    {
        private readonly ApplicationDbContext _context;

        public TripService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Trip> AssignTripAsync(AssignTripRequest request)
        {
            var indent = await _context.Indents.FindAsync(request.IndentId);
            if (indent == null) throw new Exception("Indent not found.");

            Trip? trip = null;
            if (request.TripId.HasValue && request.TripId.Value > 0)
            {
                trip = await _context.Trips.Include(t => t.Indent).FirstOrDefaultAsync(t => t.Id == request.TripId.Value);
            }

            if (trip == null)
            {
                // Look for an unassigned trip for this indent (e.g. from RFQ or pre-created leg)
                trip = await _context.Trips.FirstOrDefaultAsync(t => t.IndentId == request.IndentId && (t.VehicleId == null || t.DriverId == null));
                if (trip == null)
                {
                    trip = await _context.Trips.FirstOrDefaultAsync(t => t.IndentId == request.IndentId);
                }
            }
            
            bool isNewTrip = false;
            if (trip == null)
            {
                trip = new Trip();
                isNewTrip = true;
            }

            // Calculate Freight
            decimal freightCharges = 0;
            if (request.BookingType == "PerTon")
            {
                freightCharges = indent.Weight * request.RatePerTon;
            }
            else
            {
                freightCharges = request.FixedRate;
            }

            trip.IndentId = request.IndentId;
            trip.VendorId = request.VendorId;
            trip.VehicleId = request.VehicleId;
            trip.DriverId = request.DriverId;
            trip.BookingType = request.BookingType;
            trip.RatePerTon = request.RatePerTon;
            trip.FixedRate = request.FixedRate;
            trip.AdvanceAmount = request.AdvanceAmount;
            trip.SupplierPaymentTo = request.SupplierPaymentTo;
            trip.StartingKM = request.StartingKM;
            trip.TripStartDate = request.TripStartDate;
            trip.FreightCharges = freightCharges;
            trip.BalanceAmount = freightCharges - request.AdvanceAmount; // balance is freight - advance
            trip.Status = "Assigned";
            
            // Automatically determine LegType based on WarehouseLocation and ServiceScope
            if (string.IsNullOrEmpty(trip.LegType) || trip.LegType == "Direct")
            {
                if (!string.IsNullOrEmpty(indent.WarehouseLocation))
                {
                    trip.LegType = (trip.ServiceScope == "SourceToHub") ? "InboundLeg1" : "EntireRoute";
                }
                else
                {
                    trip.LegType = "Direct";
                }
            }

            // Single Customer Invoice: Inbound Leg 1 is internal (CustomerRate = 0),
            // while Outbound Leg 2, EntireRoute, or Direct trip carries the full customer agreed rate (from approved SQ with margin).
            if (trip.LegType == "InboundLeg1")
            {
                trip.CustomerRate = 0;
                indent.Status = "Assigned";
            }
            else
            {
                // Retrieve the approved SQ selling price (vendor rate + margin) if available
                var approvedSq = await _context.SalesQuotations
                    .Where(sq => sq.IndentId == indent.Id && (sq.Status == "Approved" || sq.Status == "PO_Received"))
                    .OrderByDescending(sq => sq.Id)
                    .FirstOrDefaultAsync();

                decimal customerAgreedPrice = approvedSq?.SellingPrice 
                    ?? (trip.CustomerRate.HasValue && trip.CustomerRate.Value > 0 ? trip.CustomerRate.Value : (indent.CustomerRate.HasValue && indent.CustomerRate.Value > 0 ? indent.CustomerRate.Value : 0));

                if (customerAgreedPrice > 0)
                {
                    trip.CustomerRate = customerAgreedPrice;
                    indent.CustomerRate = customerAgreedPrice;
                }

                if (trip.LegType == "OutboundLeg2")
                {
                    indent.Status = "Outbound_Assigned";
                }
                else
                {
                    indent.Status = "Assigned";
                }
            }
            
            if (isNewTrip)
            {
                trip.CreatedAt = DateTime.UtcNow;
                _context.Trips.Add(trip);
            }
            else
            {
                _context.Entry(trip).State = EntityState.Modified;
            }

            await _context.SaveChangesAsync();

            return trip;
        }

        public async Task<Trip> UpdateTripStatusAsync(int tripId, string newStatus)
        {
            var trip = await _context.Trips
                .Include(t => t.Indent)
                .FirstOrDefaultAsync(t => t.Id == tripId);
            if (trip == null) throw new Exception("Trip not found.");

            if (newStatus == "Started" && string.IsNullOrEmpty(trip.LRNumber))
            {
                throw new Exception("LR Generation is mandatory before starting the trip.");
            }

            trip.Status = newStatus;

            // Keep Indent status synchronized with live trip progress
            if (trip.Indent != null)
            {
                if (newStatus == "Delivered" || newStatus == "Completed")
                {
                    if (trip.LegType == "InboundLeg1" && !string.IsNullOrEmpty(trip.Indent.WarehouseLocation))
                    {
                        trip.Indent.Status = "At_Hub";
                    }
                    else
                    {
                        trip.Indent.Status = "Completed";
                    }
                }
                else if (newStatus == "Started" || newStatus == "InTransit")
                {
                    if (trip.LegType == "InboundLeg1")
                    {
                        trip.Indent.Status = "Inbound_Transit";
                    }
                    else if (trip.LegType == "OutboundLeg2")
                    {
                        trip.Indent.Status = "Outbound_Transit";
                    }
                    else
                    {
                        trip.Indent.Status = "InTransit";
                    }
                }
            }

            await _context.SaveChangesAsync();

            return trip;
        }

        public async Task<Trip> RecalculateBalanceAsync(int tripId)
        {
            var trip = await _context.Trips
                .Include(t => t.Payments)
                .Include(t => t.AdditionalCharges)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if (trip == null) throw new Exception("Trip not found.");

            decimal totalPayments = trip.Payments?.Sum(p => p.Amount) ?? 0;
            decimal approvedVendorExtraCharges = trip.AdditionalCharges?
                .Where(a => (a.Status == "Approved" || string.IsNullOrEmpty(a.Status)) && a.PayableToVendor)
                .Sum(a => a.Amount) ?? 0;

            trip.BalanceAmount = trip.FreightCharges + approvedVendorExtraCharges - totalPayments;
            
            await _context.SaveChangesAsync();

            return trip;
        }
    }
}
