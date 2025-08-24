# Use the official .NET 9 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ASUCourseTracker.API.csproj .
RUN dotnet restore

# Copy source code and build
COPY . .
RUN dotnet build -c Release -o /app/build

# Publish the application
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Install Playwright and browsers in the build stage
RUN dotnet tool install --global Microsoft.Playwright.CLI
ENV PATH="$PATH:/root/.dotnet/tools"
RUN playwright install chromium
RUN playwright install-deps chromium

# Use the official .NET 9 runtime image for the final image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install required packages for Selenium/Playwright if needed
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    ca-certificates \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable for Chrome
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# Copy the published application
COPY --from=build /app/publish .

# Create a non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy Playwright browsers from build stage and set permissions
COPY --from=build /root/.cache/ms-playwright /home/appuser/.cache/ms-playwright
RUN chown -R appuser:appgroup /app /home/appuser/.cache

USER appuser

# Expose the port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
ENTRYPOINT ["dotnet", "ASUCourseTracker.API.dll"]


