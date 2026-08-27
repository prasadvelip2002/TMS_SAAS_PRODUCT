using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api_backend.Data;
using Microsoft.EntityFrameworkCore;
using api_backend.Models;
using System;
using System.Threading.Tasks;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class LoginRequest
        {
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? Password { get; set; }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Dynamic Driver Login via Phone Number
            if (!string.IsNullOrEmpty(request.Phone))
            {
                var driver = await _context.Drivers.IgnoreQueryFilters().FirstOrDefaultAsync(d => d.Phone == request.Phone);
                if (driver == null) 
                {
                    // Fallback to the seeded driver if they just type anything for demo purposes
                    driver = await _context.Drivers.IgnoreQueryFilters().FirstOrDefaultAsync();
                    if (driver == null) return Unauthorized(new { message = "No drivers exist in system." });
                }

                var demoTenantId = driver.TenantId;
                var demoCompanyId = driver.CompanyId;
                var demoUserId = driver.Id;
                
                var demoKey = _configuration["Jwt:Key"] ?? "SuperSecretKeyForTransportManagementSystem!123";
                var demoSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(demoKey));
                var demoCredentials = new SigningCredentials(demoSecurityKey, SecurityAlgorithms.HmacSha256);

                var demoClaims = new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, demoUserId.ToString()),
                    new Claim("Phone", driver.Phone ?? ""),
                    new Claim("TenantId", demoTenantId.ToString()),
                    new Claim("CompanyId", demoCompanyId.ToString()),
                    new Claim(ClaimTypes.Role, "Driver")
                };

                var demoToken = new JwtSecurityToken(
                    issuer: _configuration["Jwt:Issuer"],
                    audience: _configuration["Jwt:Audience"],
                    claims: demoClaims,
                    expires: DateTime.Now.AddHours(24),
                    signingCredentials: demoCredentials);

                return Ok(new
                {
                    token = new JwtSecurityTokenHandler().WriteToken(demoToken),
                    user = new { Id = demoUserId, Name = driver.Name, Phone = driver.Phone, Role = "Driver", TenantId = demoTenantId, CompanyId = demoCompanyId }
                });
            }

            var user = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordHash == request.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var jwtKey = _configuration["Jwt:Key"] ?? "SuperSecretKeyForTransportManagementSystem!123";
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("TenantId", user.TenantId.ToString()),
                new Claim("CompanyId", user.CompanyId.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(24),
                signingCredentials: credentials);

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user = new { user.Id, user.Name, user.Email, user.Role, user.TenantId, user.CompanyId }
            });
        }
        
        public class SetupRequest
        {
            public required string TenantName { get; set; }
            public required string CompanyName { get; set; }
            public required string AdminName { get; set; }
            public string? AdminPhone { get; set; }
            public required string AdminEmail { get; set; }
            public required string AdminPassword { get; set; }
        }

        [HttpPost("setup")]
        public async Task<IActionResult> Setup([FromBody] SetupRequest request)
        {
            var tenant = new Tenant { Name = request.TenantName };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            var company = new Company { Name = request.CompanyName, TenantId = tenant.Id };
            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            var user = new User 
            { 
                Name = request.AdminName, 
                Email = request.AdminEmail, 
                Phone = request.AdminPhone,
                PasswordHash = request.AdminPassword, 
                Role = "Tenant Admin",
                TenantId = tenant.Id,
                CompanyId = company.Id
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Setup complete", tenantId = tenant.Id, companyId = company.Id, userId = user.Id });
        }
    }
}
