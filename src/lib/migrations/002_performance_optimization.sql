-- HappyStats Performance Optimization Migration
-- Migration 002: Add performance indexes and query optimizations

-- Additional performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_charts_user_id_created_at ON charts(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_charts_user_id_category ON charts(user_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_points_chart_id_date ON data_points(chart_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_points_chart_id_created_at ON data_points(chart_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Composite index for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_charts_user_category_created ON charts(user_id, category, created_at DESC);

-- Partial indexes for active subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active ON subscriptions(user_id) WHERE status = 'active';

-- Index for date range queries on data points
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_points_date_range ON data_points(chart_id, date) WHERE date >= CURRENT_DATE - INTERVAL '1 year';

-- Statistics update for query planner
ANALYZE users;
ANALYZE charts;
ANALYZE data_points;
ANALYZE subscriptions;

-- Create materialized view for dashboard statistics (optional optimization)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_chart_stats AS
SELECT 
    u.id as user_id,
    u.subscription_tier,
    COUNT(c.id) as chart_count,
    COUNT(dp.id) as total_data_points,
    MAX(c.created_at) as last_chart_created,
    MAX(dp.created_at) as last_data_point_added
FROM users u
LEFT JOIN charts c ON u.id = c.user_id
LEFT JOIN data_points dp ON c.id = dp.chart_id
GROUP BY u.id, u.subscription_tier;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_chart_stats_user_id ON user_chart_stats(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_chart_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_chart_stats;
END;
$$ LANGUAGE plpgsql;