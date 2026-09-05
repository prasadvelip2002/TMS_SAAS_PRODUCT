using Microsoft.AspNetCore.Authorization;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System;
using System.Linq;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    [ApiController]
    public class CustomerRateContractsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerRateContractsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/CustomerRateContracts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRateContracts(
            [FromQuery] int? customerId,
            [FromQuery] string? source,
            [FromQuery] string? destination,
            [FromQuery] string? vehicleType,
            [FromQuery] string? status)
        {
            var query = _context.CustomerRateContracts
                .Include(r => r.Customer)
                .AsQueryable();

            if (customerId.HasValue && customerId.Value > 0)
            {
                query = query.Where(r => r.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrWhiteSpace(source))
            {
                query = query.Where(r => r.Source.ToLower().Contains(source.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(destination))
            {
                query = query.Where(r => r.Destination.ToLower().Contains(destination.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(vehicleType))
            {
                query = query.Where(r => r.VehicleType != null && r.VehicleType.ToLower().Contains(vehicleType.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

            return Ok(list.Select(r => new
            {
                r.Id,
                r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : "Unknown",
                CustomerCode = r.Customer != null ? r.Customer.Code : "",
                r.Source,
                r.Destination,
                r.VehicleType,
                r.Rate,
                r.EffectiveFrom,
                r.EffectiveTo,
                ContractDuration = r.ContractDuration ?? "1 Year",
                r.Remarks,
                Status = r.Status ?? "Active",
                r.CreatedAt
            }));
        }

        // GET: api/CustomerRateContracts/Customer/5
        [HttpGet("Customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCustomerRates(int customerId)
        {
            var list = await _context.CustomerRateContracts
                .Where(r => r.CustomerId == customerId)
                .OrderBy(r => r.Source)
                .ThenBy(r => r.Destination)
                .ToListAsync();

            return Ok(list.Select(r => new
            {
                r.Id,
                r.CustomerId,
                r.Source,
                r.Destination,
                r.VehicleType,
                r.Rate,
                r.EffectiveFrom,
                r.EffectiveTo,
                ContractDuration = r.ContractDuration ?? "1 Year",
                r.Remarks,
                Status = r.Status ?? "Active",
                r.CreatedAt
            }));
        }

        // GET: api/CustomerRateContracts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerRateContract>> GetRateContract(int id)
        {
            var contract = await _context.CustomerRateContracts
                .Include(r => r.Customer)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (contract == null)
            {
                return NotFound();
            }

            return contract;
        }

        // POST: api/CustomerRateContracts
        [HttpPost]
        public async Task<ActionResult<CustomerRateContract>> PostRateContract(CustomerRateContract contract)
        {
            contract.CreatedAt = DateTime.UtcNow;
            if (string.IsNullOrEmpty(contract.Status)) contract.Status = "Active";
            if (string.IsNullOrEmpty(contract.ContractDuration)) contract.ContractDuration = "1 Year";

            _context.CustomerRateContracts.Add(contract);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRateContract), new { id = contract.Id }, contract);
        }

        public class RateItemDto
        {
            public int? Id { get; set; }
            public required string Source { get; set; }
            public required string Destination { get; set; }
            public string? VehicleType { get; set; }
            public decimal Rate { get; set; }
            public string? Remarks { get; set; }
            public string? Status { get; set; }
        }

        public class BulkSyncRequest
        {
            public string? ContractDuration { get; set; } = "1 Year";
            public DateTime? EffectiveFrom { get; set; }
            public DateTime? EffectiveTo { get; set; }
            public List<RateItemDto> Rates { get; set; } = new();
        }

        // POST: api/CustomerRateContracts/BulkSync/5
        [HttpPost("BulkSync/{customerId}")]
        public async Task<IActionResult> BulkSyncCustomerRates(int customerId, [FromBody] BulkSyncRequest req)
        {
            var customer = await _context.Customers.FindAsync(customerId);
            if (customer == null)
            {
                return NotFound(new { message = "Customer not found" });
            }

            var effFrom = req.EffectiveFrom ?? DateTime.UtcNow;
            var effTo = req.EffectiveTo ?? DateTime.UtcNow.AddYears(1);
            var duration = string.IsNullOrWhiteSpace(req.ContractDuration) ? "1 Year" : req.ContractDuration;

            // Update customer's RateContract summary field
            customer.RateContract = $"{duration} Contract ({req.Rates.Count} Rates)";
            _context.Customers.Update(customer);

            // Remove existing rates for this customer to replace with new set
            var existing = await _context.CustomerRateContracts
                .Where(r => r.CustomerId == customerId)
                .ToListAsync();
            _context.CustomerRateContracts.RemoveRange(existing);

            // Add new rates
            var newEntities = new List<CustomerRateContract>();
            foreach (var r in req.Rates)
            {
                if (string.IsNullOrWhiteSpace(r.Source) || string.IsNullOrWhiteSpace(r.Destination))
                    continue;

                newEntities.Add(new CustomerRateContract
                {
                    CustomerId = customerId,
                    Source = r.Source.Trim(),
                    Destination = r.Destination.Trim(),
                    VehicleType = string.IsNullOrWhiteSpace(r.VehicleType) ? "Any" : r.VehicleType.Trim(),
                    Rate = r.Rate,
                    EffectiveFrom = effFrom,
                    EffectiveTo = effTo,
                    ContractDuration = duration,
                    Remarks = r.Remarks,
                    Status = string.IsNullOrWhiteSpace(r.Status) ? "Active" : r.Status,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (newEntities.Any())
            {
                _context.CustomerRateContracts.AddRange(newEntities);
            }

            await _context.SaveChangesAsync();
            return Ok(new { count = newEntities.Count, message = "Rates synchronized successfully" });
        }

        public class BulkImportItemDto
        {
            public int? CustomerId { get; set; }
            public string? CustomerNameOrCode { get; set; }
            public required string Source { get; set; }
            public required string Destination { get; set; }
            public string? VehicleType { get; set; }
            public decimal Rate { get; set; }
            public string? ContractDuration { get; set; }
            public DateTime? EffectiveFrom { get; set; }
            public DateTime? EffectiveTo { get; set; }
            public string? Remarks { get; set; }
            public string? Status { get; set; }
        }

        // POST: api/CustomerRateContracts/Bulk
        [HttpPost("Bulk")]
        public async Task<IActionResult> BulkImportRates([FromBody] List<BulkImportItemDto> items)
        {
            if (items == null || items.Count == 0)
            {
                return BadRequest("No items provided");
            }

            var customers = await _context.Customers.ToListAsync();
            var addedList = new List<CustomerRateContract>();

            foreach (var item in items)
            {
                int targetCustomerId = item.CustomerId ?? 0;
                if (targetCustomerId == 0 && !string.IsNullOrWhiteSpace(item.CustomerNameOrCode))
                {
                    var matched = customers.FirstOrDefault(c => 
                        c.Name.Equals(item.CustomerNameOrCode.Trim(), StringComparison.OrdinalIgnoreCase) ||
                        (c.Code != null && c.Code.Equals(item.CustomerNameOrCode.Trim(), StringComparison.OrdinalIgnoreCase)));
                    if (matched != null)
                    {
                        targetCustomerId = matched.Id;
                    }
                }

                if (targetCustomerId == 0)
                {
                    continue; // Skip without valid customer
                }

                var effFrom = item.EffectiveFrom ?? DateTime.UtcNow;
                var effTo = item.EffectiveTo ?? DateTime.UtcNow.AddYears(1);

                addedList.Add(new CustomerRateContract
                {
                    CustomerId = targetCustomerId,
                    Source = item.Source.Trim(),
                    Destination = item.Destination.Trim(),
                    VehicleType = string.IsNullOrWhiteSpace(item.VehicleType) ? "Any" : item.VehicleType.Trim(),
                    Rate = item.Rate,
                    ContractDuration = string.IsNullOrWhiteSpace(item.ContractDuration) ? "1 Year" : item.ContractDuration.Trim(),
                    EffectiveFrom = effFrom,
                    EffectiveTo = effTo,
                    Remarks = item.Remarks,
                    Status = string.IsNullOrWhiteSpace(item.Status) ? "Active" : item.Status,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (addedList.Count > 0)
            {
                _context.CustomerRateContracts.AddRange(addedList);
                await _context.SaveChangesAsync();
            }

            return Ok(new { importedCount = addedList.Count, message = $"Successfully imported {addedList.Count} contract rates" });
        }

        // PUT: api/CustomerRateContracts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRateContract(int id, CustomerRateContract contract)
        {
            if (id != contract.Id)
            {
                return BadRequest();
            }

            var existing = await _context.CustomerRateContracts.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            existing.Source = contract.Source;
            existing.Destination = contract.Destination;
            existing.VehicleType = contract.VehicleType;
            existing.Rate = contract.Rate;
            existing.EffectiveFrom = contract.EffectiveFrom;
            existing.EffectiveTo = contract.EffectiveTo;
            existing.ContractDuration = contract.ContractDuration ?? "1 Year";
            existing.Remarks = contract.Remarks;
            existing.Status = contract.Status ?? "Active";
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/CustomerRateContracts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRateContract(int id)
        {
            var contract = await _context.CustomerRateContracts.FindAsync(id);
            if (contract == null)
            {
                return NotFound();
            }

            _context.CustomerRateContracts.Remove(contract);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
