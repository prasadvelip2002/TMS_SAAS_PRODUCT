namespace api_backend.Models
{
    public interface ICompanyEntity
    {
        int CompanyId { get; set; }
        Company? Company { get; set; }
    }
}
