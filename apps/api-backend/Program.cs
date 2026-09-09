using api_backend.Data;
using Microsoft.EntityFrameworkCore;
using api_backend.Services;
using api_backend.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Add HttpContextAccessor for DbContext
builder.Services.AddHttpContextAccessor();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForTransportManagementSystem!123";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddHostedService<DailySchedulerService>();

builder.Services.AddScoped<ITripService, TripService>();
builder.Services.AddScoped<IDocumentService, LocalDocumentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

var app = builder.Build();

// Ensure DB schema permits NULL for VendorId, VehicleId, DriverId on Trips table (for Own Fleet)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Trips\" ALTER COLUMN \"VendorId\" DROP NOT NULL;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Trips\" ALTER COLUMN \"VehicleId\" DROP NOT NULL;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Trips\" ALTER COLUMN \"DriverId\" DROP NOT NULL;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"VendorQuotations\" ADD COLUMN IF NOT EXISTS \"ServiceScope\" text;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Trips\" ADD COLUMN IF NOT EXISTS \"ServiceScope\" text;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Trips\" ADD COLUMN IF NOT EXISTS \"CostBreakdownJson\" text;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"SalesQuotations\" ADD COLUMN IF NOT EXISTS \"LegType\" text;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"SalesQuotations\" ADD COLUMN IF NOT EXISTS \"TripId\" integer;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"SalesQuotations\" ADD COLUMN IF NOT EXISTS \"CostBreakdownJson\" text;");
        db.Database.ExecuteSqlRaw(@"
            UPDATE ""Trips"" t
            SET ""ServiceScope"" = COALESCE(vq.""ServiceScope"", 'EntireRoute')
            FROM ""SalesQuotations"" sq
            JOIN ""VendorQuotations"" vq ON sq.""WinningVendorQuotationId"" = vq.""Id""
            WHERE t.""IndentId"" = sq.""IndentId"" AND t.""ServiceScope"" IS NULL;

            UPDATE ""Trips"" t
            SET ""LegType"" = 'InboundLeg1'
            WHERE t.""ServiceScope"" = 'SourceToHub' AND t.""LegType"" != 'OutboundLeg2';

            UPDATE ""Trips"" t
            SET ""LegType"" = 'EntireRoute'
            WHERE t.""ServiceScope"" = 'EntireRoute' AND t.""LegType"" != 'OutboundLeg2' AND EXISTS (SELECT 1 FROM ""Indents"" i WHERE i.""Id"" = t.""IndentId"" AND i.""WarehouseLocation"" IS NOT NULL AND i.""WarehouseLocation"" != '');

            UPDATE ""Trips""
            SET ""Status"" = 'Pending Assignment'
            WHERE (""VehicleId"" IS NULL OR ""DriverId"" IS NULL) AND ""Status"" = 'Assigned';

            UPDATE ""SalesQuotations"" sq
            SET ""LegType"" = CASE 
                WHEN vq.""ServiceScope"" = 'SourceToHub' THEN 'InboundLeg1'
                WHEN vq.""ServiceScope"" = 'EntireRoute' THEN 'EntireRoute'
                ELSE 'Direct'
            END
            FROM ""VendorQuotations"" vq
            WHERE sq.""WinningVendorQuotationId"" = vq.""Id"" AND sq.""LegType"" IS NULL;

            UPDATE ""Trips"" t
            SET ""CustomerRate"" = sq.""SellingPrice""
            FROM ""SalesQuotations"" sq
            WHERE t.""IndentId"" = sq.""IndentId"" 
              AND (sq.""Status"" = 'Approved' OR sq.""Status"" = 'PO_Received')
              AND sq.""SellingPrice"" > 0
              AND (t.""LegType"" = 'InboundLeg1' OR t.""LegType"" = 'EntireRoute' OR t.""LegType"" = 'Direct');

            UPDATE ""Indents"" i
            SET ""CustomerRate"" = sq.""SellingPrice""
            FROM ""SalesQuotations"" sq
            WHERE i.""Id"" = sq.""IndentId"" 
              AND (sq.""Status"" = 'Approved' OR sq.""Status"" = 'PO_Received')
              AND sq.""SellingPrice"" > 0;
        ");
    }
    catch (Exception ex)
    {
        Console.WriteLine("DB Migration Notice: " + ex.Message);
    }
}

// Configure the HTTP request pipeline.
// Always enable Swagger for the demo
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "Hitro Logistics API is running successfully on Render! Navigate to /swagger to view the API documentation.");

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
