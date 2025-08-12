import { NextResponse } from 'next/server';
import { query } from '../../../lib/database';
import { isProduction } from '../../../lib/production-config';

// Metrics endpoint for monitoring (protected in production)
export async function GET(request: Request) {
  // In production, require authentication or API key
  if (isProduction) {
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.METRICS_API_KEY;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  try {
    const startTime = Date.now();
    
    // Database metrics
    const [
      userCount,
      chartCount,
      dataPointCount,
      subscriptionStats
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM charts'),
      query('SELECT COUNT(*) as count FROM data_points'),
      query(`
        SELECT 
          subscription_tier,
          COUNT(*) as count
        FROM users 
        GROUP BY subscription_tier
      `)
    ]);
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Database connection pool metrics (if available)
    const poolMetrics = {
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
    };
    
    const metrics = {
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      
      // Application metrics
      application: {
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
      },
      
      // Database metrics
      database: {
        users: parseInt(userCount.rows[0].count),
        charts: parseInt(chartCount.rows[0].count),
        dataPoints: parseInt(dataPointCount.rows[0].count),
        subscriptions: subscriptionStats.rows.reduce((acc, row) => {
          acc[row.subscription_tier] = parseInt(row.count);
          return acc;
        }, {} as Record<string, number>),
        connectionPool: poolMetrics,
      },
      
      // System metrics
      system: {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      },
    };
    
    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Metrics collection failed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}