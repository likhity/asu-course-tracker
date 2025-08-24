# Database Migration Script for CI/CD Pipeline (PowerShell)
# Run this script with postgres/master user credentials

param(
    [Parameter(Mandatory=$true)]
    [string]$DbHost,
    
    [Parameter(Mandatory=$true)]
    [string]$DbName,
    
    [Parameter(Mandatory=$true)]
    [string]$PostgresUser,
    
    [Parameter(Mandatory=$true)]
    [string]$PostgresPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$DbPort = "5432"
)

Write-Host "Starting database migrations..." -ForegroundColor Green

# Build connection string for migrations (using postgres/master user)
$connectionString = "Host=$DbHost;Database=$DbName;Username=$PostgresUser;Password=$PostgresPassword;Port=$DbPort;SSL Mode=Require;"
$env:ConnectionStrings__DefaultConnection = $connectionString

Write-Host "Connected to: $DbHost/$DbName" -ForegroundColor Yellow
Write-Host "Running migrations as: $PostgresUser" -ForegroundColor Yellow

try {
    # Run Entity Framework migrations
    dotnet ef database update --verbose
    
    Write-Host "✅ Database migrations completed successfully!" -ForegroundColor Green
    Write-Host "📋 Migration history:" -ForegroundColor Cyan
    dotnet ef migrations list
}
catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
