using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BranchesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BranchesController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class BranchDto
        {
            public int Id { get; set; }
            public required string Name { get; set; }
            public string? Code { get; set; }
            public string? Location { get; set; }
            public string? Address { get; set; }
            public string? Phone { get; set; }
            public string? GstNumber { get; set; }
            public bool IsHeadOffice { get; set; }
            public string? Status { get; set; }
            public DateTime CreatedAt { get; set; }
            public int ActiveTripsCount { get; set; }
            public int TeamMembersCount { get; set; }
        }

        public class CreateBranchRequest
        {
            public required string Name { get; set; }
            public string? Code { get; set; }
            public string? Location { get; set; }
            public string? Address { get; set; }
            public string? Phone { get; set; }
            public string? GstNumber { get; set; }
            public bool IsHeadOffice { get; set; } = false;
        }

        // GET: api/Branches
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BranchDto>>> GetBranches()
        {
            var branches = await _context.Branches.ToListAsync();

            // If no branches exist for this company yet, auto-create a default Head Office
            if (branches.Count == 0)
            {
                var firstTenant = await _context.Tenants.FirstOrDefaultAsync();
                var firstCompany = await _context.Companies.FirstOrDefaultAsync();
                if (firstTenant != null && firstCompany != null)
                {
                    var defaultBranch = new Branch
                    {
                        Name = "Head Office",
                        Code = "HO",
                        Location = "Headquarters",
                        IsHeadOffice = true,
                        TenantId = _context.CurrentTenantId > 0 ? _context.CurrentTenantId : firstTenant.Id,
                        CompanyId = _context.CurrentCompanyId > 0 ? _context.CurrentCompanyId : firstCompany.Id
                    };
                    _context.Branches.Add(defaultBranch);
                    await _context.SaveChangesAsync();
                    branches.Add(defaultBranch);
                }
            }

            // Get counts per branch
            var branchIds = branches.Select(b => b.Id).ToList();
            
            var tripCounts = await _context.Trips
                .Where(t => t.BranchId.HasValue && branchIds.Contains(t.BranchId.Value) && t.Status != "Completed" && t.Status != "Cancelled")
                .GroupBy(t => t.BranchId!.Value)
                .Select(g => new { BranchId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.BranchId, x => x.Count);

            var userCounts = await _context.Users
                .Where(u => u.BranchId.HasValue && branchIds.Contains(u.BranchId.Value))
                .GroupBy(u => u.BranchId!.Value)
                .Select(g => new { BranchId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.BranchId, x => x.Count);

            var dtos = branches.Select(b => new BranchDto
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code ?? $"BR-{b.Id:D2}",
                Location = b.Location,
                Address = b.Address,
                Phone = b.Phone,
                GstNumber = b.GstNumber,
                IsHeadOffice = b.IsHeadOffice,
                Status = b.Status ?? "Active",
                CreatedAt = b.CreatedAt,
                ActiveTripsCount = tripCounts.ContainsKey(b.Id) ? tripCounts[b.Id] : 0,
                TeamMembersCount = userCounts.ContainsKey(b.Id) ? userCounts[b.Id] : 0
            }).OrderByDescending(b => b.IsHeadOffice).ThenBy(b => b.Name).ToList();

            return Ok(dtos);
        }

        // GET: api/Branches/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BranchDto>> GetBranch(int id)
        {
            var b = await _context.Branches.FindAsync(id);
            if (b == null) return NotFound(new { message = "Branch not found" });

            var activeTrips = await _context.Trips
                .CountAsync(t => t.BranchId == id && t.Status != "Completed" && t.Status != "Cancelled");
            var members = await _context.Users.CountAsync(u => u.BranchId == id);

            return Ok(new BranchDto
            {
                Id = b.Id,
                Name = b.Name,
                Code = b.Code,
                Location = b.Location,
                Address = b.Address,
                Phone = b.Phone,
                GstNumber = b.GstNumber,
                IsHeadOffice = b.IsHeadOffice,
                Status = b.Status ?? "Active",
                CreatedAt = b.CreatedAt,
                ActiveTripsCount = activeTrips,
                TeamMembersCount = members
            });
        }

        // POST: api/Branches
        [HttpPost]
        public async Task<ActionResult<BranchDto>> CreateBranch([FromBody] CreateBranchRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
            {
                return BadRequest(new { message = "Branch Name is required." });
            }

            var branch = new Branch
            {
                Name = req.Name.Trim(),
                Code = string.IsNullOrWhiteSpace(req.Code) ? null : req.Code.Trim().ToUpper(),
                Location = req.Location?.Trim(),
                Address = req.Address?.Trim(),
                Phone = req.Phone?.Trim(),
                GstNumber = req.GstNumber?.Trim()?.ToUpper(),
                IsHeadOffice = req.IsHeadOffice
            };

            // If marked as Head Office, unmark previous Head Office
            if (req.IsHeadOffice)
            {
                var existingHOs = await _context.Branches.Where(b => b.IsHeadOffice).ToListAsync();
                foreach (var ho in existingHOs)
                {
                    ho.IsHeadOffice = false;
                }
            }

            if (_context.CurrentTenantId <= 0)
            {
                var firstTenant = await _context.Tenants.FirstOrDefaultAsync();
                var firstCompany = await _context.Companies.FirstOrDefaultAsync();
                if (firstTenant != null) branch.TenantId = firstTenant.Id;
                if (firstCompany != null) branch.CompanyId = firstCompany.Id;
            }

            _context.Branches.Add(branch);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBranch), new { id = branch.Id }, new BranchDto
            {
                Id = branch.Id,
                Name = branch.Name,
                Code = branch.Code ?? $"BR-{branch.Id:D2}",
                Location = branch.Location,
                Address = branch.Address,
                Phone = branch.Phone,
                GstNumber = branch.GstNumber,
                IsHeadOffice = branch.IsHeadOffice,
                Status = branch.Status ?? "Active",
                CreatedAt = branch.CreatedAt,
                ActiveTripsCount = 0,
                TeamMembersCount = 0
            });
        }

        // PUT: api/Branches/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBranch(int id, [FromBody] CreateBranchRequest req)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null) return NotFound(new { message = "Branch not found" });

            branch.Name = req.Name.Trim();
            branch.Code = string.IsNullOrWhiteSpace(req.Code) ? branch.Code : req.Code.Trim().ToUpper();
            branch.Location = req.Location?.Trim();
            branch.Address = req.Address?.Trim();
            branch.Phone = req.Phone?.Trim();
            branch.GstNumber = req.GstNumber?.Trim()?.ToUpper();

            if (req.IsHeadOffice && !branch.IsHeadOffice)
            {
                var existingHOs = await _context.Branches.Where(b => b.IsHeadOffice && b.Id != id).ToListAsync();
                foreach (var ho in existingHOs)
                {
                    ho.IsHeadOffice = false;
                }
                branch.IsHeadOffice = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Branch updated successfully", branch });
        }

        // DELETE: api/Branches/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBranch(int id)
        {
            var branch = await _context.Branches.FindAsync(id);
            if (branch == null) return NotFound(new { message = "Branch not found" });

            if (branch.IsHeadOffice)
            {
                return BadRequest(new { message = "Cannot delete the designated Head Office branch." });
            }

            var hasActiveTrips = await _context.Trips.AnyAsync(t => t.BranchId == id && t.Status != "Completed" && t.Status != "Cancelled");
            if (hasActiveTrips)
            {
                return BadRequest(new { message = "Cannot delete branch with active trips in progress. Please reassign or complete those trips first." });
            }

            _context.Branches.Remove(branch);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Branch removed successfully" });
        }
    }
}
