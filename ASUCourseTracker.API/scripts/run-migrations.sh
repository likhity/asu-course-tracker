#!/bin/bash

# Database Migration Script for CI/CD Pipeline
# Run this script with postgres/master user credentials

set -e  # Exit on any error

echo "Starting database migrations..."

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "Error: Required environment variables not set:"
    echo "  DB_HOST, DB_NAME, POSTGRES_USER, POSTGRES_PASSWORD"
    exit 1
fi

# Build connection string for migrations (using postgres/master user)
export ConnectionStrings__DefaultConnection="Host=${DB_HOST};Database=${DB_NAME};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD};Port=${DB_PORT:-5432};SSL Mode=Require;"

echo "Connected to: ${DB_HOST}/${DB_NAME}"
echo "Running migrations as: ${POSTGRES_USER}"

# Run Entity Framework migrations
dotnet ef database update --verbose

echo "✅ Database migrations completed successfully!"
echo "📋 Migration history:"
dotnet ef migrations list
