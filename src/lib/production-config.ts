// Production configuration and utilities
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Database configuration for production
export const dbConfig = {
  maxConnections: isProduction ? 25 : 10,
  minConnections: isProduction ? 5 : 2,
  connectionTimeout: isProduction ? 5000 : 2000,
  statementTimeout: isProduction ? 30000 : 10000,
  queryTimeout: isProduction ? 30000 : 10000,
};

// Cache configuration
export const cacheConfig = {
  // Static assets cache duration (1 year for production)
  staticAssets: isProduction ? 31536000 : 3600,
  // API responses cache duration (5 minutes for production)
  apiResponses: isProduction ? 300 : 0,
  // Page cache duration (1 hour for production)
  pages: isProduction ? 3600 : 0,
};

// Security configuration
export const securityConfig = {
  // CORS origins
  allowedOrigins: isProduction 
    ? [process.env.NEXTAUTH_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // requests per window
  },
  
  // Session configuration
  session: {
    maxAge: isProduction ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days prod, 1 day dev
    updateAge: isProduction ? 24 * 60 * 60 : 60 * 60, // 1 day prod, 1 hour dev
  },
};

// Logging configuration
export const loggingConfig = {
  level: isProduction ? 'warn' : 'debug',
  enableSlowQueryLogging: isProduction,
  slowQueryThreshold: 1000, // ms
  enableErrorReporting: isProduction,
};

// Performance monitoring thresholds
export const performanceConfig = {
  // Database query performance
  slowQueryThreshold: 1000, // ms
  connectionPoolWarningThreshold: 0.8, // 80% of max connections
  
  // API response times
  apiResponseWarningThreshold: 2000, // ms
  
  // Memory usage
  memoryWarningThreshold: 0.85, // 85% of available memory
};

// Feature flags for production
export const featureFlags = {
  enableAnalytics: isProduction,
  enableErrorReporting: isProduction,
  enablePerformanceMonitoring: isProduction,
  enableDetailedLogging: !isProduction,
  enableDebugMode: !isProduction,
};

// Environment validation
export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  // Only require Stripe keys in production
  if (isProduction) {
    requiredEnvVars.push('STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY');
  }

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    if (isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.warn(`⚠️  Missing environment variables (development): ${missing.join(', ')}`);
    }
  }

  // Validate URLs
  try {
    if (process.env.NEXTAUTH_URL) new URL(process.env.NEXTAUTH_URL);
    if (process.env.DATABASE_URL) new URL(process.env.DATABASE_URL);
  } catch (error) {
    if (isProduction) {
      throw new Error('Invalid URL format in environment variables');
    } else {
      console.warn('⚠️  Invalid URL format in environment variables (development)');
    }
  }

  // Validate Stripe keys format in production
  if (isProduction && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      throw new Error('Production requires live Stripe secret key');
    }
    if (!process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')) {
      throw new Error('Production requires live Stripe publishable key');
    }
  }

  console.log('✓ Environment validation passed');
}

// Initialize production configuration
export function initializeProduction() {
  if (isProduction) {
    // Validate environment
    validateEnvironment();
    
    // Set process title for monitoring
    process.title = 'happystats-app';
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      // In production, you might want to report this to an error tracking service
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // In production, you might want to report this to an error tracking service
    });
    
    console.log('✓ Production configuration initialized');
  }
}