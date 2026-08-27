using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class SeedController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SeedController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("make-platform-admin")]
        public async Task<IActionResult> MakeAdmin()
        {
            var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == "admin@demo.com");
            if (user != null) {
                user.Role = "Platform Admin";
                await _context.SaveChangesAsync();
                return Ok("Done");
            }
            return NotFound();
        }

        [HttpPost("run")]
        public async Task<IActionResult> RunSeed()
        {
            var tenant = await _context.Tenants.FirstOrDefaultAsync();
            if (tenant == null) return BadRequest(new { message = "No tenant found. Please run auth setup first." });
            int tId = tenant.Id;

            // Clear previous trips, indents, invoices
            _context.Payments.RemoveRange(_context.Payments.Where(p => p.TenantId == tId));
            _context.Invoices.RemoveRange(_context.Invoices.Where(p => p.TenantId == tId));
            _context.Trips.RemoveRange(_context.Trips.Where(t => t.TenantId == tId));
            _context.Indents.RemoveRange(_context.Indents.Where(i => i.TenantId == tId));
            await _context.SaveChangesAsync();

            var hyundai = await _context.Customers.FirstOrDefaultAsync(c => c.Code == "HYUNDAI-OEM") 
                          ?? new Customer { Name = "Hyundai Motor India", Code = "HYUNDAI-OEM", GSTIN = "33AAACH1234D", Phone = "044-1234", Email = "a@a.com", Address = "Sriperumbudur", City = "Chennai", State = "TN", PAN = "AAACH", CreditLimit = 5000000, PaymentTerms = "Net 60", ContactPerson = "Rahul", RateContract = "AnnualContract", Status = "Active", TenantId = tId };
            var kia = await _context.Customers.FirstOrDefaultAsync(c => c.Code == "KIA-OEM")
                          ?? new Customer { Name = "KIA Motors", Code = "KIA-OEM", GSTIN = "37AAACK5678", Phone = "08555-23", Email = "b@b.com", Address = "Penukonda", City = "Anantapur", State = "AP", PAN = "AAACK", CreditLimit = 3000000, PaymentTerms = "Net 45", ContactPerson = "Vikram", RateContract = "AnnualContract", Status = "Active", TenantId = tId };
            if (hyundai.Id == 0) _context.Customers.Add(hyundai);
            if (kia.Id == 0) _context.Customers.Add(kia);
            await _context.SaveChangesAsync();

            var ramesh = await _context.Vendors.FirstOrDefaultAsync(v => v.Code == "VEND-RAM")
                          ?? new Vendor { Name = "Ramesh Transports", Code = "VEND-RAM", GSTIN = "29AAACR", PAN = "AAACR", BankDetails = "HDFC", TDSInfo = "2%", ContactPerson = "Ramesh", Email = "c@c.com", Address = "Yesh", City = "Bangalore", State = "KA", Phone = "99", RouteRemarks = "Reliable", Status = "Active", TenantId = tId };
            var singh = await _context.Vendors.FirstOrDefaultAsync(v => v.Code == "VEND-SIN")
                          ?? new Vendor { Name = "Singh Fleet Services", Code = "VEND-SIN", GSTIN = "07AAACS", PAN = "AAACS", BankDetails = "SBI", TDSInfo = "2%", ContactPerson = "Gurpreet", Email = "d@d.com", Address = "Delhi", City = "Delhi", State = "DL", Phone = "98", RouteRemarks = "National", Status = "Active", TenantId = tId };
            if (ramesh.Id == 0) _context.Vendors.Add(ramesh);
            if (singh.Id == 0) _context.Vendors.Add(singh);
            await _context.SaveChangesAsync();

            var v1 = await _context.Vehicles.FirstOrDefaultAsync(v => v.Code == "VEH-001") ?? new Vehicle { VehicleNumber = "TN-01-AB-1234", OwnerName = "Hitro Logistics", Capacity = 15, Code = "VEH-001", Type = "Open Truck", Status = "Active", TenantId = tId };
            var v2 = await _context.Vehicles.FirstOrDefaultAsync(v => v.Code == "VEH-003") ?? new Vehicle { VehicleNumber = "KA-05-MN-4567", OwnerName = "Ramesh Transports", Capacity = 10, Code = "VEH-003", Type = "Canter", Status = "Active", VendorId = ramesh.Id, TenantId = tId };
            if (v1.Id == 0) _context.Vehicles.Add(v1);
            if (v2.Id == 0) _context.Vehicles.Add(v2);
            await _context.SaveChangesAsync();

            var d1 = await _context.Drivers.FirstOrDefaultAsync(d => d.Name == "Murugan V") ?? new Driver { Name = "Murugan V", Phone = "9012345678", LicenseNumber = "TN-DL", ExperienceYears = 8, CurrentStatus = "Available", Aadhaar = "123", TenantId = tId };
            if (d1.Id == 0) _context.Drivers.Add(d1);
            await _context.SaveChangesAsync();

            // Create a bunch of past Invoices
            var inv1 = new Invoice { CustomerId = hyundai.Id, InvoiceNumber = "INV-2026-F1A2", TotalAmount = 450000, TaxAmount = 81000, GrandTotal = 531000, InvoiceDate = DateTime.UtcNow.AddDays(-20), DueDate = DateTime.UtcNow.AddDays(10), Status = "Paid", TenantId = tId };
            var inv2 = new Invoice { CustomerId = kia.Id, InvoiceNumber = "INV-2026-B8C9", TotalAmount = 280000, TaxAmount = 50400, GrandTotal = 330400, InvoiceDate = DateTime.UtcNow.AddDays(-5), DueDate = DateTime.UtcNow.AddDays(25), Status = "Unpaid", TenantId = tId };
            _context.Invoices.AddRange(inv1, inv2);
            await _context.SaveChangesAsync();

            // Create past Trips attached to invoices
            for (int i = 0; i < 5; i++)
            {
                var pastIndent = new Indent { CustomerId = hyundai.Id, Source = "Chennai", Destination = "Delhi", Material = "Auto Parts", Weight = 14, VehicleType = "Container", LoadingDate = DateTime.UtcNow.AddDays(-25 + i), Status = "Closed", TenantId = tId };
                _context.Indents.Add(pastIndent);
                await _context.SaveChangesAsync();

                var pastTrip = new Trip { 
                    IndentId = pastIndent.Id, VehicleId = v1.Id, DriverId = d1.Id, VendorId = ramesh.Id, 
                    Status = "Closed", LegType = "Direct", TenantId = tId, 
                    TripStartDate = DateTime.UtcNow.AddDays(-24 + i), TripEndDate = DateTime.UtcNow.AddDays(-20 + i),
                    FreightCharges = 90000, SupplierRate = 75000, TollCharges = 2500, AdvanceAmount = 40000,
                    PODUploadedDate = DateTime.UtcNow.AddDays(-20 + i), PODReceivedDate = DateTime.UtcNow.AddDays(-19 + i),
                    InvoiceId = inv1.Id, IsVendorSettled = true
                };
                _context.Trips.Add(pastTrip);
            }

            // Create trips for POD Review & Unbilled
            for (int i = 0; i < 3; i++)
            {
                var ind = new Indent { CustomerId = kia.Id, Source = "Bangalore", Destination = "Anantapur", Material = "Engines", Weight = 8, VehicleType = "Canter", LoadingDate = DateTime.UtcNow.AddDays(-2), Status = "Assigned", TenantId = tId };
                _context.Indents.Add(ind);
                await _context.SaveChangesAsync();

                var trip = new Trip {
                    IndentId = ind.Id, VehicleId = v2.Id, DriverId = d1.Id, VendorId = singh.Id,
                    Status = "Delivered", LegType = "Direct", TenantId = tId,
                    FreightCharges = 35000, SupplierRate = 28000, AdvanceAmount = 15000,
                    PODUploadedDate = DateTime.UtcNow.AddHours(-5), // Needs Review
                    PODMagicLinkToken = Guid.NewGuid().ToString()
                };
                _context.Trips.Add(trip);
            }

            // Create a trip that is Closed but Unbilled and Unsettled
            var uInd = new Indent { CustomerId = hyundai.Id, Source = "Pune", Destination = "Chennai", Material = "Spares", Weight = 10, VehicleType = "Container", LoadingDate = DateTime.UtcNow.AddDays(-4), Status = "Closed", TenantId = tId };
            _context.Indents.Add(uInd);
            await _context.SaveChangesAsync();

            var uTrip = new Trip {
                IndentId = uInd.Id, VehicleId = v1.Id, DriverId = d1.Id, VendorId = ramesh.Id,
                Status = "Closed", LegType = "Direct", TenantId = tId,
                FreightCharges = 65000, SupplierRate = 55000, AdvanceAmount = 25000,
                PODUploadedDate = DateTime.UtcNow.AddDays(-1), PODReceivedDate = DateTime.UtcNow.AddHours(-2),
                IsVendorSettled = false // Needs Settlement
            };
            _context.Trips.Add(uTrip);

            // Ongoing Trip for Live Tracking
            var liveInd = new Indent { CustomerId = kia.Id, Source = "Mumbai", Destination = "Delhi", Material = "Machinery", Weight = 18, VehicleType = "Trailer", LoadingDate = DateTime.UtcNow, Status = "Assigned", TenantId = tId };
            _context.Indents.Add(liveInd);
            await _context.SaveChangesAsync();

            var liveTrip = new Trip {
                IndentId = liveInd.Id, VehicleId = v1.Id, DriverId = d1.Id, VendorId = ramesh.Id,
                Status = "Started", LegType = "Direct", TenantId = tId,
                TripStartDate = DateTime.UtcNow.AddHours(-14)
            };
            _context.Trips.Add(liveTrip);

            // RFQ Indent
            var rfqInd = new Indent { CustomerId = hyundai.Id, Source = "Kolkata", Destination = "Chennai", Material = "Steel", Weight = 25, VehicleType = "Flatbed", LoadingDate = DateTime.UtcNow.AddDays(2), Status = "Pending", RFQStatus = "Broadcasted", TenantId = tId };
            _context.Indents.Add(rfqInd);
            
            await _context.SaveChangesAsync();

            // Add Vendor Quotation for RFQ
            _context.VendorQuotations.Add(new VendorQuotation { IndentId = rfqInd.Id, VendorId = ramesh.Id, QuotedRate = 110000, Status = "Pending", Remarks = "Available immediately", TenantId = tId });
            _context.VendorQuotations.Add(new VendorQuotation { IndentId = rfqInd.Id, VendorId = singh.Id, QuotedRate = 105000, Status = "Pending", Remarks = "Can load tomorrow", TenantId = tId });

            await _context.SaveChangesAsync();

            return Ok(new { message = "Extensive Demo Data Seeded Successfully!" });
        }
    }
}
