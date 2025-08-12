import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the database module
vi.mock('@/lib/database', () => ({
  healthCheck: vi.fn(),
}));

// Mock the production config
vi.mock('@/lib/production-config', () => ({
  isProduction: false,
}));

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status when database is healthy', async () => {
    const { healthCheck } = await import('@/lib/database');
    vi.mocked(healthCheck).mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database).toBe('healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('responseTime');
  });

  it('should return unhealthy status when database is unhealthy', async () => {
    const { healthCheck } = await import('@/lib/database');
    vi.mocked(healthCheck).mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database).toBe('unhealthy');
  });

  it('should return unhealthy status when database check throws error', async () => {
    const { healthCheck } = await import('@/lib/database');
    vi.mocked(healthCheck).mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data).toHaveProperty('error');
  });

  it('should include detailed info in development mode', async () => {
    const { healthCheck } = await import('@/lib/database');
    vi.mocked(healthCheck).mockResolvedValue(true);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('details');
    expect(data.details).toHaveProperty('memory');
    expect(data.details).toHaveProperty('nodeVersion');
    expect(data.details).toHaveProperty('platform');
  });

  it('should set correct cache headers', async () => {
    const { healthCheck } = await import('@/lib/database');
    vi.mocked(healthCheck).mockResolvedValue(true);

    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
  });
});