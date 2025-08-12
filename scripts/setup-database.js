#!/usr/bin/env node

// Database setup script to run migrations and test connection

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DATABASE_URL?.includes('ssl=true') 
    ? { rejectUnauthorized: false } 
    : false,
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    const migrationsDir = path.join(__dirname, '../src/lib/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('📝 No migration files found');
      return true;
    }
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`📄 Running migration: ${file}`);
      await pool.query(migrationSQL);
      console.log(`✅ Migration ${file} completed`);
    }
    
    console.log('🎉 All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    console.log('📋 Found tables:', tables);
    
    // Check if required tables exist
    const requiredTables = ['users', 'charts', 'data_points', 'subscriptions'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      return false;
    } else {
      console.log('✅ All required tables exist');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
    return false;
  }
}

async function main() {
  console.log('🏁 Starting database setup...\n');
  
  // Test connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Database setup failed - connection issue');
    process.exit(1);
  }
  
  console.log('');
  
  // Run migrations
  const migrationsOk = await runMigrations();
  if (!migrationsOk) {
    console.log('\n❌ Database setup failed - migration issue');
    process.exit(1);
  }
  
  console.log('');
  
  // Check tables
  const tablesOk = await checkTables();
  if (!tablesOk) {
    console.log('\n⚠️  Database setup completed but some tables may be missing');
  }
  
  console.log('\n🎉 Database setup completed successfully!');
  
  // Close the pool
  await pool.end();
}

// Run the setup
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});