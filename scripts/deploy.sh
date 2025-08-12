#!/bin/bash

# HappyStats Deployment Script for Coolify
set -e

echo "🚀 Starting HappyStats deployment..."

# Check if required environment variables are set
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "STRIPE_SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var environment variable is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate || echo "⚠️  Migration failed or no migrations to run"

# Health check
echo "🏥 Performing health check..."
timeout 30 bash -c 'until curl -f http://localhost:3000/api/health; do sleep 2; done' || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Application is ready at: $NEXTAUTH_URL"