using api_backend.Data;
using Microsoft.EntityFrameworkCore;
using api_backend.Services;
using api_backend.Services.Interfaces;
using api_backend.Services.Tracking;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// Add HttpContextAccessor for DbContext
builder.Services.AddHttpContextAccessor();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// -------------------------------------------------------------
// Load .env variables so .env acts as boss for local/prod
// -------------------------------------------------------------
var envPaths = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env")
};
foreach (var path in envPaths)
{
    if (File.Exists(path))
    {
        foreach (var line in File.ReadAllLines(path))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith("#")) continue;
            var parts = trimmed.Split('=', 2);
            if (parts.Length == 2)
            {
                Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
            }
        }
    }
}

// Add services to the container.
// Priority: DATABASE_URL / DB_CONNECTION -> DefaultConnection (Neon) -> LocalConnection (Localhost)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DB_CONNECTION")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration.GetConnectionString("LocalConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

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
builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<DotmoveLocationProvider>();
builder.Services.AddScoped<MobileGpsLocationProvider>();
builder.Services.AddScoped<ILocationService, LocationService>();

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
        db.Database.ExecuteSqlRaw("ALTER TABLE \"SalesQuotations\" ADD COLUMN IF NOT EXISTS \"MagicLinkToken\" text;");
        db.Database.ExecuteSqlRaw("UPDATE \"SalesQuotations\" SET \"MagicLinkToken\" = gen_random_uuid()::text WHERE \"MagicLinkToken\" IS NULL;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"WhatsAppLogs\" ADD COLUMN IF NOT EXISTS \"Message\" text;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"WhatsAppLogs\" ADD COLUMN IF NOT EXISTS \"RecipientName\" text;");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"WhatsAppLogs\" ADD COLUMN IF NOT EXISTS \"ExternalMessageId\" text;");

        // Fix column types for TripLocations (CreatedBy and UpdatedBy must be integer to match BaseEntity)
        try
        {
            db.Database.ExecuteSqlRaw(@"
                DO $$
                BEGIN
                    BEGIN
                        ALTER TABLE ""TripLocations"" ALTER COLUMN ""CreatedBy"" TYPE integer USING (NULLIF(""CreatedBy"", '')::integer);
                    EXCEPTION WHEN OTHERS THEN 
                    END;
                    BEGIN
                        ALTER TABLE ""TripLocations"" ALTER COLUMN ""UpdatedBy"" TYPE integer USING (NULLIF(""UpdatedBy"", '')::integer);
                    EXCEPTION WHEN OTHERS THEN 
                    END;
                END $$;
            ");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Migration Notice] {ex.Message}");
        }

        // Tracking & Telecom LBS / Mobile GPS schema
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Drivers\" ADD COLUMN IF NOT EXISTS \"TrackingType\" text DEFAULT 'MOBILE_GPS';");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Drivers\" ADD COLUMN IF NOT EXISTS \"TrackingProvider\" text DEFAULT 'MOBILE';");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Drivers\" ADD COLUMN IF NOT EXISTS \"ConsentStatus\" text DEFAULT 'Pending';");
        db.Database.ExecuteSqlRaw("ALTER TABLE \"Drivers\" ADD COLUMN IF NOT EXISTS \"SimConsentRef\" text;");
        db.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""TripLocations"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""TripId"" integer NOT NULL,
                ""VehicleId"" integer,
                ""DriverId"" integer,
                ""Latitude"" double precision NOT NULL,
                ""Longitude"" double precision NOT NULL,
                ""Accuracy"" double precision,
                ""Speed"" double precision,
                ""Heading"" double precision,
                ""Source"" text NOT NULL DEFAULT 'MOBILE_GPS',
                ""Provider"" text NOT NULL DEFAULT 'MOBILE',
                ""DeviceId"" text,
                ""Msisdn"" text,
                ""Status"" text DEFAULT 'Active',
                ""Address"" text,
                ""RawPayloadJson"" text,
                ""RecordedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""ReceivedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""TenantId"" integer NOT NULL DEFAULT 1,
                ""CompanyId"" integer NOT NULL DEFAULT 1,
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""UpdatedAt"" timestamp with time zone,
                ""CreatedBy"" integer,
                ""UpdatedBy"" integer
            );
            ALTER TABLE ""TripLocations"" ADD COLUMN IF NOT EXISTS ""Status"" text DEFAULT 'Active';
            ALTER TABLE ""TripLocations"" ADD COLUMN IF NOT EXISTS ""Provider"" text DEFAULT 'MOBILE';
            ALTER TABLE ""TripLocations"" ADD COLUMN IF NOT EXISTS ""DeviceId"" text;
            ALTER TABLE ""TripLocations"" ADD COLUMN IF NOT EXISTS ""Msisdn"" text;
            ALTER TABLE ""TripLocations"" ADD COLUMN IF NOT EXISTS ""ReceivedAt"" timestamp with time zone DEFAULT NOW();

            CREATE TABLE IF NOT EXISTS ""VehicleCurrentLocations"" (
                ""Id"" SERIAL PRIMARY KEY,
                ""VehicleId"" integer NOT NULL,
                ""DriverId"" integer,
                ""TripId"" integer,
                ""Latitude"" double precision NOT NULL,
                ""Longitude"" double precision NOT NULL,
                ""Accuracy"" double precision,
                ""Speed"" double precision,
                ""Heading"" double precision,
                ""TrackingType"" text NOT NULL DEFAULT 'MOBILE_GPS',
                ""TrackingProvider"" text NOT NULL DEFAULT 'MOBILE',
                ""TrackingStatus"" text NOT NULL DEFAULT 'LIVE',
                ""Address"" text,
                ""DeviceId"" text,
                ""Msisdn"" text,
                ""RecordedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""ReceivedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""LastLocationAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""Status"" text DEFAULT 'Active',
                ""TenantId"" integer NOT NULL DEFAULT 1,
                ""CompanyId"" integer NOT NULL DEFAULT 1,
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                ""UpdatedAt"" timestamp with time zone,
                ""CreatedBy"" integer,
                ""UpdatedBy"" integer
            );
            CREATE INDEX IF NOT EXISTS ""IX_VehicleCurrentLocations_VehicleId"" ON ""VehicleCurrentLocations"" (""VehicleId"");
        ");
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

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

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
