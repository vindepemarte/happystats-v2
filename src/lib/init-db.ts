// Database initialization script

import { runMigrations, testConnection, healthCheck } from './database';

export async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const connectionTest = await testConnection();
    
    if (!connectionTest) {
      throw new Error('Database connection failed');
    }
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    await runMigrations();
    
    // Final health check
    console.log('🏥 Performing health check...');
    const healthStatus = await healthCheck();
    
    if (!healthStatus) {
      throw new Error('Database health check failed');
    }
    
    console.log('✅ Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}