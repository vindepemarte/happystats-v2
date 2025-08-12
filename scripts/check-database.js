#!/usr/bin/env node

// Simple script to check database status

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database status...\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', tables);
    
    // Check users table
    if (tables.includes('users')) {
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log('👥 Users in database:', userCount.rows[0].count);
    }
    
    // Check charts table
    if (tables.includes('charts')) {
      const chartCount = await client.query('SELECT COUNT(*) as count FROM charts');
      console.log('📊 Charts in database:', chartCount.rows[0].count);
    }
    
    client.release();
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();