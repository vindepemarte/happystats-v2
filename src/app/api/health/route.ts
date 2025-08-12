import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/database';
import { isProduction } from '@/lib/production-config';

// Health check endpoint for monitoring and load balancers
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbHealthy = await healthCheck();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Determine overall health status
    const isHealthy = dbHealthy && responseTime < 5000; // 5 second threshold
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      checks: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        memory: memoryUsageMB.heapUsed < 500 ? 'healthy' : 'warning', // 500MB threshold
      },
      // Only include detailed info in development
      ...((!isProduction) && {
        details: {
          memory: memoryUsageMB,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        }
      })
    };
    
    return NextResponse.json(
      healthData,
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: isProduction ? 'Internal server error' : String(error),
        responseTime: Date.now() - startTime,
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}