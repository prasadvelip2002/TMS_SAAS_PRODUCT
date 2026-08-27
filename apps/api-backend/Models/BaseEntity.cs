using System;

namespace api_backend.Models
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        
        public string? Status { get; set; } = "Active";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? CreatedBy { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        public int? UpdatedBy { get; set; }
    }
}
