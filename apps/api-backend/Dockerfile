# Use the official .NET 8.0 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the csproj and restore dependencies
COPY ["api-backend.csproj", "./"]
RUN dotnet restore "api-backend.csproj"

# Copy the remaining source code
COPY . .

# Build and publish the application
RUN dotnet publish "api-backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 8.0 ASP.NET runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port 8080 (Render/Railway/Cloud Run inject PORT dynamically)
EXPOSE 8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

CMD ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet api-backend.dll"]
