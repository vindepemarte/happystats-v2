// Application startup initialization
import { initializeProduction } from './production-config';
import { runMigrations, testConnection } from './database';

export async function initializeApplication() {
  console.log('🚀 Initializing HappyStats application...');
  
  try {
    // Initialize production configuration
    initializeProduction();
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Run database migrations
    console.log('🔄 Running database migrations...');
    await runMigrations();
    
    console.log('✅ Application initialized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    
    // In production, exit the process if initialization fails
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
}

// Initialize on module load in production (but not during build)
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  initializeApplication().catch((error) => {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  });
}