using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api_backend.Data;
using api_backend.Models;

namespace api_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Platform Admin,Tenant Admin")]
    public class CompaniesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompaniesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentCompany()
        {
            var company = await _context.Companies.FirstOrDefaultAsync();
            if (company == null) return NotFound();
            return Ok(company);
        }

        [HttpPut("current")]
        public async Task<IActionResult> UpdateCurrentCompany(Company updatedCompany)
        {
            var company = await _context.Companies.FirstOrDefaultAsync();
            if (company == null) return NotFound();

            company.Name = updatedCompany.Name;
            company.GSTIN = updatedCompany.GSTIN;
            company.Address = updatedCompany.Address;
            
            await _context.SaveChangesAsync();
            return Ok(company);
        }
    }
}
