import { NextRequest, NextResponse } from 'next/server';
import { isProduction, performanceConfig } from '../production-config';

// Performance monitoring middleware
export function performanceMiddleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Add performance headers
  const response = NextResponse.next();
  
  // Add timing information
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  response.headers.set('X-Timestamp', new Date().toISOString());
  
  // Add cache headers for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Add no-cache headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  
  // Log slow requests in production
  if (isProduction) {
    const responseTime = Date.now() - startTime;
    if (responseTime > performanceConfig.apiResponseWarningThreshold) {
      console.warn(`Slow request detected: ${request.nextUrl.pathname} (${responseTime}ms)`);
    }
  }
  
  return response;
}

// Rate limiting for API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(request: NextRequest, limit: number = 100, windowMs: number = 15 * 60 * 1000) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return NextResponse.next();
  }
  
  if (current.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString(),
        }
      }
    );
  }
  
  current.count++;
  
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', (limit - current.count).toString());
  response.headers.set('X-RateLimit-Reset', current.resetTime.toString());
  
  return response;
}

// Security headers middleware
export function securityHeadersMiddleware(response: NextResponse) {
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}