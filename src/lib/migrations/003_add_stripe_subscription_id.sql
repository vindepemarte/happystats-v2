-- Add stripe_subscription_id to users table
-- Migration 003: Add Stripe subscription ID tracking

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Index for subscription ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);

-- Update statistics
ANALYZE users;