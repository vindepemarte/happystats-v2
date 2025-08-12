// Subscription model with CRUD operations

import { query, transaction, toCamelCase, toSnakeCase, DatabaseError } from '../database';
import { 
  Subscription, 
  CreateSubscriptionData, 
  UpdateSubscriptionData,
  SubscriptionStatus,
  SUBSCRIPTION_TIERS,
  getSubscriptionLimits
} from '../../types/subscription';

// Create a new subscription
export async function createSubscription(subscriptionData: CreateSubscriptionData): Promise<Subscription> {
  try {
    const snakeData = toSnakeCase(subscriptionData);
    const result = await query(
      `INSERT INTO subscriptions (user_id, stripe_subscription_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        snakeData.user_id, 
        snakeData.stripe_subscription_id, 
        snakeData.status,
        snakeData.current_period_start,
        snakeData.current_period_end
      ]
    );
    
    if (result.rows.length === 0) {
      throw new DatabaseError('Failed to create subscription');
    }
    
    return toCamelCase(result.rows[0]) as Subscription;
  } catch (error) {
    throw new DatabaseError('Failed to create subscription', error);
  }
}

// Get subscription by ID
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  try {
    const result = await query('SELECT * FROM subscriptions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as Subscription;
  } catch (error) {
    throw new DatabaseError('Failed to get subscription by ID', error);
  }
}

// Get subscription by user ID
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  try {
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as Subscription;
  } catch (error) {
    throw new DatabaseError('Failed to get subscription by user ID', error);
  }
}

// Get subscription by Stripe subscription ID
export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
  try {
    const result = await query(
      'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1',
      [stripeSubscriptionId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as Subscription;
  } catch (error) {
    throw new DatabaseError('Failed to get subscription by Stripe ID', error);
  }
}

// Update subscription
export async function updateSubscription(id: string, updateData: UpdateSubscriptionData): Promise<Subscription | null> {
  try {
    const snakeData = toSnakeCase(updateData);
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      throw new DatabaseError('No fields to update');
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE subscriptions SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as Subscription;
  } catch (error) {
    throw new DatabaseError('Failed to update subscription', error);
  }
}

// Update subscription by Stripe ID
export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string, 
  updateData: UpdateSubscriptionData
): Promise<Subscription | null> {
  try {
    const snakeData = toSnakeCase(updateData);
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      throw new DatabaseError('No fields to update');
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE subscriptions SET ${setClause} WHERE stripe_subscription_id = $1 RETURNING *`,
      [stripeSubscriptionId, ...values]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as Subscription;
  } catch (error) {
    throw new DatabaseError('Failed to update subscription by Stripe ID', error);
  }
}

// Delete subscription
export async function deleteSubscription(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM subscriptions WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw new DatabaseError('Failed to delete subscription', error);
  }
}

// Check if subscription is active
export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status !== 'active') {
    return false;
  }
  
  // If there's no end date, it's active (lifetime subscription)
  if (!subscription.currentPeriodEnd) {
    return true;
  }
  
  // Check if current period hasn't ended
  return new Date() < subscription.currentPeriodEnd;
}

// Get active subscriptions that are expiring soon (within 7 days)
export async function getExpiringSoonSubscriptions(): Promise<Subscription[]> {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE status = 'active' 
       AND current_period_end IS NOT NULL 
       AND current_period_end <= $1 
       AND current_period_end > NOW()
       ORDER BY current_period_end ASC`,
      [sevenDaysFromNow]
    );
    
    return toCamelCase(result.rows) as Subscription[];
  } catch (error) {
    throw new DatabaseError('Failed to get expiring subscriptions', error);
  }
}

// Get overdue subscriptions
export async function getOverdueSubscriptions(): Promise<Subscription[]> {
  try {
    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE status = 'active' 
       AND current_period_end IS NOT NULL 
       AND current_period_end < NOW()
       ORDER BY current_period_end ASC`
    );
    
    return toCamelCase(result.rows) as Subscription[];
  } catch (error) {
    throw new DatabaseError('Failed to get overdue subscriptions', error);
  }
}

// Sync user subscription tier with subscription status
export async function syncUserSubscriptionTier(userId: string): Promise<void> {
  try {
    await transaction(async (client) => {
      // Get the user's current subscription
      const subscriptionResult = await client.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      
      let newTier = 'free';
      let newStatus = 'active';
      
      if (subscriptionResult.rows.length > 0) {
        const subscription = subscriptionResult.rows[0];
        
        if (subscription.status === 'active') {
          // Determine tier based on Stripe price ID or subscription type
          if (subscription.stripe_subscription_id) {
            // This is a recurring subscription (monthly)
            newTier = 'monthly';
          } else {
            // This is likely a lifetime subscription
            newTier = 'lifetime';
          }
        } else {
          // Subscription is not active, downgrade to free
          newTier = 'free';
          newStatus = subscription.status;
        }
      }
      
      // Update user's subscription tier
      await client.query(
        'UPDATE users SET subscription_tier = $1, subscription_status = $2 WHERE id = $3',
        [newTier, newStatus, userId]
      );
    });
  } catch (error) {
    throw new DatabaseError('Failed to sync user subscription tier', error);
  }
}

// Get subscription statistics
export async function getSubscriptionStatistics() {
  try {
    const result = await query(`
      SELECT 
        u.subscription_tier,
        COUNT(*) as user_count,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN s.status = 'canceled' THEN 1 END) as canceled_subscriptions,
        COUNT(CASE WHEN s.status = 'past_due' THEN 1 END) as past_due_subscriptions
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      GROUP BY u.subscription_tier
      ORDER BY u.subscription_tier
    `);
    
    return result.rows;
  } catch (error) {
    throw new DatabaseError('Failed to get subscription statistics', error);
  }
}

// Validate subscription limits
export async function validateSubscriptionLimits(userId: string, action: 'create_chart' | 'add_data_point'): Promise<boolean> {
  try {
    // Get user's subscription tier
    const userResult = await query('SELECT subscription_tier FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return false;
    }
    
    const subscriptionTier = userResult.rows[0].subscription_tier;
    const limits = getSubscriptionLimits(subscriptionTier);
    
    switch (action) {
      case 'create_chart':
        if (limits.chartLimit === undefined) {
          return true; // Unlimited
        }
        
        const chartCountResult = await query('SELECT COUNT(*) as count FROM charts WHERE user_id = $1', [userId]);
        const currentChartCount = parseInt(chartCountResult.rows[0].count);
        
        return currentChartCount < limits.chartLimit;
      
      case 'add_data_point':
        // For now, we'll allow data point creation if chart limit allows
        // In the future, we could add per-chart data point limits
        return true;
      
      default:
        return false;
    }
  } catch (error) {
    throw new DatabaseError('Failed to validate subscription limits', error);
  }
}