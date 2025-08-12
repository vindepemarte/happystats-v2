# HappyStats Deployment Guide

This guide covers deploying HappyStats to production using Docker and Coolify.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- Stripe account (live keys for production)
- Domain name with SSL certificate

## Environment Variables

Copy `.env.production.example` to `.env.production` and configure:

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-super-secret-jwt-secret-here"
NEXTAUTH_URL="https://your-domain.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### Optional Variables

```bash
# Monitoring
METRICS_API_KEY="your-metrics-api-key"

# Email (for password reset)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"
FROM_EMAIL="noreply@your-domain.com"
```

## Docker Deployment

### Using Docker Compose (Recommended for development)

```bash
# Clone the repository
git clone <repository-url>
cd happystats

# Copy and configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f app
```

### Using Dockerfile (Production)

```bash
# Build the image
docker build -t happystats .

# Run the container
docker run -d \
  --name happystats \
  -p 3000:3000 \
  --env-file .env.production \
  happystats
```

## Coolify Deployment

### 1. Create New Project

1. Log into your Coolify dashboard
2. Create a new project
3. Choose "Docker Compose" or "Dockerfile" deployment

### 2. Configure Repository

- Repository URL: Your Git repository
- Branch: `main` or your production branch
- Build Pack: Docker

### 3. Environment Variables

Add all required environment variables in Coolify:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Domain Configuration

- Set up your custom domain
- Enable SSL certificate (Let's Encrypt)
- Configure DNS to point to your Coolify server

### 5. Deploy

Click "Deploy" in Coolify dashboard. The deployment will:

1. Pull the latest code
2. Build the Docker image
3. Run database migrations
4. Start the application
5. Perform health checks

## Database Setup

### PostgreSQL Configuration

Ensure your PostgreSQL database has:

- UUID extension enabled
- Proper connection limits
- SSL enabled (recommended)
- Regular backups configured

### Migrations

Migrations run automatically during deployment. To run manually:

```bash
npm run db:migrate
```

## Health Checks

The application provides several health check endpoints:

- `/api/health` - Overall application health
- `/api/ready` - Readiness probe for load balancers
- `/api/metrics` - Application metrics (requires API key)

## Monitoring

### Health Monitoring

Configure your monitoring system to check:

```bash
# Health check
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "responseTime": 45,
  "checks": {
    "database": "healthy",
    "memory": "healthy"
  }
}
```

### Metrics Collection

Access metrics with API key:

```bash
curl -H "Authorization: Bearer your-metrics-api-key" \
     https://your-domain.com/api/metrics
```

### Log Monitoring

Monitor application logs for:

- Slow queries (>1000ms)
- High memory usage
- Database connection issues
- Authentication failures

## Performance Optimization

### Database Optimization

The application includes:

- Connection pooling (25 connections in production)
- Query performance monitoring
- Optimized indexes for common queries
- Materialized views for dashboard statistics

### Caching

- Static assets cached for 1 year
- API responses cached appropriately
- PWA caching for offline functionality

### Image Optimization

- Next.js Image component with WebP/AVIF support
- Lazy loading for below-the-fold images
- Responsive image sizes

## Security

### Headers

The application sets security headers:

- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin

### Rate Limiting

API endpoints are rate-limited:

- 100 requests per 15 minutes per IP
- Configurable per endpoint

### SSL/TLS

- Force HTTPS in production
- HSTS headers enabled
- Secure cookie settings

## Backup Strategy

### Database Backups

Set up automated PostgreSQL backups:

```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### File Backups

- User uploaded files (if any)
- Configuration files
- SSL certificates

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is accessible
   - Check SSL configuration

2. **Stripe Webhook Errors**
   - Verify webhook endpoint URL
   - Check webhook secret
   - Ensure endpoint is accessible

3. **High Memory Usage**
   - Monitor `/api/metrics` endpoint
   - Check for memory leaks
   - Adjust connection pool settings

4. **Slow Performance**
   - Check database query performance
   - Monitor `/api/health` response times
   - Review application logs

### Debug Mode

Enable debug logging in development:

```bash
NODE_ENV=development npm start
```

### Support

For deployment issues:

1. Check application logs
2. Verify environment variables
3. Test health check endpoints
4. Review database connectivity

## Scaling

### Horizontal Scaling

- Use load balancer (nginx, Cloudflare)
- Multiple application instances
- Shared PostgreSQL database
- Redis for session storage (optional)

### Vertical Scaling

- Increase server resources
- Adjust database connection pool
- Monitor memory and CPU usage

## Updates

### Rolling Updates

1. Test in staging environment
2. Backup database
3. Deploy new version
4. Run health checks
5. Monitor for issues

### Rollback Plan

1. Keep previous Docker image
2. Database migration rollback scripts
3. Quick rollback procedure documented

This deployment guide ensures a robust, scalable, and secure production deployment of HappyStats.