import { NextResponse } from 'next/server';
import { testConnection } from '../../../lib/database';

// Readiness probe for Kubernetes/Docker deployments
export async function GET() {
  try {
    // Check if the application is ready to serve traffic
    const dbReady = await testConnection();
    
    if (!dbReady) {
      return NextResponse.json(
        { 
          status: 'not ready',
          reason: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
    
    // Check if required environment variables are set
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'not ready',
          reason: `Missing environment variables: ${missingEnvVars.join(', ')}`,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        status: 'ready',
        timestamp: new Date().toISOString()
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    
  } catch (error) {
    console.error('Readiness check failed:', error);
    
    return NextResponse.json(
      {
        status: 'not ready',
        reason: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}