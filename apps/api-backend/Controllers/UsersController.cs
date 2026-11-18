using Microsoft.AspNetCore.Authorization;
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
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class UserDto
        {
            public int Id { get; set; }
            public required string Name { get; set; }
            public required string Email { get; set; }
            public string? Phone { get; set; }
            public required string Role { get; set; }
            public int? BranchId { get; set; }
            public string? BranchName { get; set; }
            public int TenantId { get; set; }
            public int CompanyId { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        public class CreateUserRequest
        {
            public required string Name { get; set; }
            public required string Email { get; set; }
            public string? Phone { get; set; }
            public required string Password { get; set; }
            public required string Role { get; set; } // Tenant Admin, Operations Manager, Branch Supervisor, Dispatcher, Finance
            public int? BranchId { get; set; }
        }

        public class UpdateUserRequest
        {
            public string? Name { get; set; }
            public string? Phone { get; set; }
            public string? Role { get; set; }
            public int? BranchId { get; set; }
            public string? Password { get; set; }
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var userBranchIdClaim = User.FindFirst("BranchId")?.Value;
            int? userBranchId = int.TryParse(userBranchIdClaim, out var bid) && bid > 0 ? bid : null;

            bool isGlobalAdmin = roleClaim == "Tenant Admin" || roleClaim == "Admin" || roleClaim == "Platform Admin" || string.IsNullOrEmpty(roleClaim);

            var query = _context.Users
                .Include(u => u.Branch)
                .AsQueryable();

            if (!isGlobalAdmin && userBranchId.HasValue)
            {
                // Branch Manager/Supervisor only sees team members of their own branch
                query = query.Where(u => u.BranchId == userBranchId.Value);
            }

            var users = await query
                .OrderByDescending(u => u.Role == "Tenant Admin" || u.Role == "Admin")
                .ThenBy(u => u.Name)
                .Select(u => new UserDto 
                { 
                    Id = u.Id, 
                    Name = u.Name, 
                    Email = u.Email, 
                    Phone = u.Phone,
                    Role = u.Role, 
                    BranchId = u.BranchId,
                    BranchName = u.Branch != null ? u.Branch.Name : (u.Role == "Tenant Admin" || u.Role == "Admin" ? "All Branches (Head Office)" : "Unassigned"),
                    TenantId = u.TenantId, 
                    CompanyId = u.CompanyId,
                    CreatedAt = u.CreatedAt
                }).ToListAsync();

            return Ok(users);
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<UserDto>> PostUser([FromBody] CreateUserRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new { message = "Email and Password are required." });
            }

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var userBranchIdClaim = User.FindFirst("BranchId")?.Value;
            int? userBranchId = int.TryParse(userBranchIdClaim, out var bid) && bid > 0 ? bid : null;

            bool isGlobalAdmin = roleClaim == "Tenant Admin" || roleClaim == "Admin" || roleClaim == "Platform Admin" || string.IsNullOrEmpty(roleClaim);

            var targetRole = string.IsNullOrWhiteSpace(req.Role) ? "Logistics Executive" : req.Role.Trim();
            int? targetBranchId = req.BranchId > 0 ? req.BranchId : null;

            // Enforce branch and role restrictions for non-global admins (e.g. Branch Manager)
            if (!isGlobalAdmin)
            {
                if (!userBranchId.HasValue)
                {
                    return Forbid();
                }

                // Force branch to the manager's branch
                targetBranchId = userBranchId.Value;

                // Branch Manager can ONLY assign Logistics Executive or Finance Executive
                if (targetRole == "Tenant Admin" || targetRole == "Platform Admin")
                {
                    return BadRequest(new { message = "Branch Managers cannot create Tenant Administrators." });
                }
            }

            var existing = await _context.Users.AnyAsync(u => u.Email == req.Email.Trim().ToLower());
            if (existing)
            {
                return BadRequest(new { message = "A user with this email address already exists." });
            }

            var user = new User
            {
                Name = req.Name.Trim(),
                Email = req.Email.Trim().ToLower(),
                Phone = req.Phone?.Trim(),
                PasswordHash = req.Password, // Same hashing approach as AuthController
                Role = targetRole,
                BranchId = targetBranchId
            };

            if (_context.CurrentTenantId <= 0)
            {
                var firstTenant = await _context.Tenants.FirstOrDefaultAsync();
                var firstCompany = await _context.Companies.FirstOrDefaultAsync();
                if (firstTenant != null) user.TenantId = firstTenant.Id;
                if (firstCompany != null) user.CompanyId = firstCompany.Id;
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Load branch name if assigned
            string? branchName = null;
            if (user.BranchId.HasValue)
            {
                var branch = await _context.Branches.FindAsync(user.BranchId.Value);
                branchName = branch?.Name;
            }

            return Ok(new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role,
                BranchId = user.BranchId,
                BranchName = branchName ?? (user.Role == "Tenant Admin" || user.Role == "Admin" ? "All Branches (Head Office)" : "Unassigned"),
                TenantId = user.TenantId,
                CompanyId = user.CompanyId,
                CreatedAt = user.CreatedAt
            });
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest req)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var userBranchIdClaim = User.FindFirst("BranchId")?.Value;
            int? userBranchId = int.TryParse(userBranchIdClaim, out var bid) && bid > 0 ? bid : null;

            bool isGlobalAdmin = roleClaim == "Tenant Admin" || roleClaim == "Admin" || roleClaim == "Platform Admin" || string.IsNullOrEmpty(roleClaim);

            if (!isGlobalAdmin)
            {
                if (!userBranchId.HasValue || user.BranchId != userBranchId.Value)
                {
                    return Forbid();
                }

                if (!string.IsNullOrWhiteSpace(req.Role) && (req.Role == "Tenant Admin" || req.Role == "Platform Admin"))
                {
                    return BadRequest(new { message = "Branch Managers cannot grant Tenant Administrator roles." });
                }
            }

            if (!string.IsNullOrWhiteSpace(req.Name)) user.Name = req.Name.Trim();
            if (req.Phone != null) user.Phone = req.Phone.Trim();
            if (!string.IsNullOrWhiteSpace(req.Role)) user.Role = req.Role.Trim();
            if (isGlobalAdmin && req.BranchId.HasValue) user.BranchId = req.BranchId.Value > 0 ? req.BranchId.Value : null;
            if (!string.IsNullOrWhiteSpace(req.Password)) user.PasswordHash = req.Password;

            await _context.SaveChangesAsync();
            return Ok(new { message = "User updated successfully" });
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
            var userBranchIdClaim = User.FindFirst("BranchId")?.Value;
            int? userBranchId = int.TryParse(userBranchIdClaim, out var bid) && bid > 0 ? bid : null;

            bool isGlobalAdmin = roleClaim == "Tenant Admin" || roleClaim == "Admin" || roleClaim == "Platform Admin" || string.IsNullOrEmpty(roleClaim);

            if (!isGlobalAdmin)
            {
                if (!userBranchId.HasValue || user.BranchId != userBranchId.Value)
                {
                    return Forbid();
                }
            }

            if (user.Role == "Tenant Admin")
            {
                var otherAdmins = await _context.Users.CountAsync(u => u.Role == "Tenant Admin" && u.Id != id);
                if (otherAdmins == 0)
                {
                    return BadRequest(new { message = "Cannot delete the only Tenant Administrator for this organization." });
                }
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User removed successfully" });
        }
    }
}
