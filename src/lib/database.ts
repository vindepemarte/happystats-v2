import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';

// Create a connection pool for PostgreSQL with optimized settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DATABASE_URL?.includes('ssl=true') 
    ? { rejectUnauthorized: false } 
    : false,
  // Production optimized pool settings
  max: process.env.NODE_ENV === 'production' ? 25 : 10,
  min: process.env.NODE_ENV === 'production' ? 5 : 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 60000,
  // Enable statement timeout for long-running queries
  statement_timeout: 30000,
  // Enable query timeout
  query_timeout: 30000,
  // Application name for monitoring
  application_name: 'happystats-app',
});

// Test the database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Execute a query with parameters and performance monitoring
export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  const startTime = Date.now();
  
  try {
    const result = await client.query(text, params);
    
    // Log slow queries in production
    const duration = Date.now() - startTime;
    if (duration > 1000 && process.env.NODE_ENV === 'production') {
      console.warn(`Slow query detected (${duration}ms):`, {
        query: text.substring(0, 100),
        duration,
        rowCount: result.rowCount
      });
    }
    
    return result;
  } finally {
    client.release();
  }
}

// Execute a prepared statement for better performance
export async function queryPrepared(name: string, text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    // Use prepared statements for frequently executed queries
    const result = await client.query({
      name,
      text,
      values: params
    });
    return result;
  } finally {
    client.release();
  }
}

// Get a client from the pool for transactions
export async function getClient() {
  return await pool.connect();
}

// Execute a transaction
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Run database migrations
export async function runMigrations() {
  try {
    const migrationsDir = path.join(process.cwd(), 'src/lib/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('Running database migrations...');
    
    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`Running migration: ${file}`);
      await query(migrationSQL);
      console.log(`✓ Migration ${file} completed`);
    }
    
    console.log('All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Database health check
export async function healthCheck() {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Generic CRUD operations
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Helper function to convert database rows to camelCase with proper date handling
export function toCamelCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    // Handle Date objects specially - don't recurse into them
    if (obj instanceof Date) {
      return obj;
    }
    
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      let value = obj[key];
      
      // Convert date strings to Date objects for known date fields
      if (value && typeof value === 'string' && 
          (key.includes('_at') || key === 'date' || camelKey.includes('At') || camelKey === 'date')) {
        try {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            value = dateValue;
          }
        } catch (error) {
          // If date parsing fails, keep the original value
          console.warn('Failed to parse date:', value, error);
        }
      }
      
      // Handle null/undefined values properly
      if (value === null || value === undefined) {
        result[camelKey] = value;
      } else if (value instanceof Date) {
        // Don't recurse into Date objects
        result[camelKey] = value;
      } else {
        result[camelKey] = toCamelCase(value);
      }
      return result;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

// Helper function to convert camelCase to snake_case for database
export function toSnakeCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

// Helper function to serialize dates for JSON responses
export function serializeDatesForJSON(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeDatesForJSON);
  }
  
  if (typeof obj === 'object') {
    // Handle empty objects that might be corrupted Date objects
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
      console.warn('serializeDatesForJSON: Found empty object, returning null');
      return null;
    }
    
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDatesForJSON(value);
    }
    return result;
  }
  
  return obj;
}

export default pool;