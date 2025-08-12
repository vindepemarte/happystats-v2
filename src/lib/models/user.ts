// User model with CRUD operations

import { query, transaction, toCamelCase, toSnakeCase, DatabaseError } from '../database';
import { User, CreateUserData, UpdateUserData, UserRow } from '../../types/user';
import bcrypt from 'bcryptjs';

// Create a new user
export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    const snakeData = toSnakeCase(userData);
    const result = await query(
      `INSERT INTO users (email, password_hash, subscription_tier, stripe_customer_id, stripe_subscription_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [snakeData.email, snakeData.password_hash, snakeData.subscription_tier || 'free', snakeData.stripe_customer_id, snakeData.stripe_subscription_id]
    );
    
    if (result.rows.length === 0) {
      throw new DatabaseError('Failed to create user');
    }
    
    return toCamelCase(result.rows[0]) as User;
  } catch (error) {
    throw new DatabaseError('Failed to create user', error);
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as User;
  } catch (error) {
    throw new DatabaseError('Failed to get user by ID', error);
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as User;
  } catch (error) {
    throw new DatabaseError('Failed to get user by email', error);
  }
}

// Update user
export async function updateUser(id: string, updateData: UpdateUserData): Promise<User | null> {
  try {
    const snakeData = toSnakeCase(updateData);
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      throw new DatabaseError('No fields to update');
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as User;
  } catch (error) {
    throw new DatabaseError('Failed to update user', error);
  }
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw new DatabaseError('Failed to delete user', error);
  }
}

// Verify user password
export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0] as UserRow;
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return null;
    }
    
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return toCamelCase(userWithoutPassword) as User;
  } catch (error) {
    throw new DatabaseError('Failed to verify user password', error);
  }
}

// Hash password utility
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new DatabaseError('Failed to hash password', error);
  }
}

// Get user chart count (for subscription limits)
export async function getUserChartCount(userId: string): Promise<number> {
  try {
    const result = await query('SELECT COUNT(*) as count FROM charts WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0].count);
  } catch (error) {
    throw new DatabaseError('Failed to get user chart count', error);
  }
}

// Check if user can create more charts based on subscription tier
export async function canUserCreateChart(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return false;
    }
    
    // Free tier users are limited to 3 charts
    if (user.subscriptionTier === 'free') {
      const chartCount = await getUserChartCount(userId);
      return chartCount < 3;
    }
    
    // Monthly and lifetime users have unlimited charts
    return true;
  } catch (error) {
    throw new DatabaseError('Failed to check chart creation permission', error);
  }
}

// Update user subscription information
export async function updateUserSubscription(
  userId: string, 
  subscriptionData: {
    subscriptionTier?: 'free' | 'monthly' | 'lifetime';
    subscriptionStatus?: 'active' | 'canceled' | 'past_due';
    stripeCustomerId?: string;
  }
): Promise<User | null> {
  try {
    return await updateUser(userId, subscriptionData);
  } catch (error) {
    throw new DatabaseError('Failed to update user subscription', error);
  }
}