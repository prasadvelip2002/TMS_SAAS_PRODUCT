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

            // Check if a Trip already exists for this Indent (e.g., from RFQ)
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.IndentId == request.IndentId);
            
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
            trip.StartingKM = request.StartingKM;
            trip.TripStartDate = request.TripStartDate;
            trip.FreightCharges = freightCharges;
            trip.BalanceAmount = freightCharges - request.AdvanceAmount; // balance is freight - advance
            trip.Status = "Assigned";

            indent.Status = "Assigned";
            
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
            var trip = await _context.Trips.FindAsync(tripId);
            if (trip == null) throw new Exception("Trip not found.");

            trip.Status = newStatus;
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
            decimal approvedExtraCharges = trip.AdditionalCharges?.Where(a => a.Status == "Approved").Sum(a => a.Amount) ?? 0;

            trip.BalanceAmount = trip.FreightCharges + approvedExtraCharges - totalPayments;
            
            await _context.SaveChangesAsync();

            return trip;
        }
    }
}
