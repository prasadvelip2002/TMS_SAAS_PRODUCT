namespace api_backend.Models
{
    public interface ITenantEntity
    {
        int TenantId { get; set; }
        Tenant? Tenant { get; set; }
    }
}
