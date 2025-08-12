/**
 * Charts API Tests
 * Tests for chart API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../charts/route';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('../../../lib/models/chart', () => ({
  createChart: vi.fn(),
  getChartsByUserId: vi.fn(),
}));

vi.mock('../../../lib/middleware/subscription', () => ({
  withChartLimit: vi.fn((handler) => handler),
}));

describe('Charts API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  };

  const mockChart = {
    id: 'test-chart-id',
    name: 'Test Chart',
    category: 'Test Category',
    userId: 'test-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataPoints: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/charts', () => {
    it('should return charts for authenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      const { getChartsByUserId } = await import('../../../lib/models/chart');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(getChartsByUserId).mockResolvedValue([mockChart]);

      const request = new NextRequest('http://localhost:3000/api/charts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('test-chart-id');
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/charts');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle search and category filters', async () => {
      const { getServerSession } = await import('next-auth');
      const { getChartsByUserId } = await import('../../../lib/models/chart');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(getChartsByUserId).mockResolvedValue([mockChart]);

      const request = new NextRequest('http://localhost:3000/api/charts?search=test&category=Test');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getChartsByUserId).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          search: 'test',
          category: 'Test',
        })
      );
    });

    it('should handle database errors', async () => {
      const { getServerSession } = await import('next-auth');
      const { getChartsByUserId } = await import('../../../lib/models/chart');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(getChartsByUserId).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/charts');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/charts', () => {
    it('should create chart for authenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      const { createChart } = await import('../../../lib/models/chart');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(createChart).mockResolvedValue(mockChart);

      const requestBody = {
        name: 'New Chart',
        category: 'New Category',
      };

      const request = new NextRequest('http://localhost:3000/api/charts', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Test Chart');
      expect(createChart).toHaveBeenCalledWith({
        name: 'New Chart',
        category: 'New Category',
        userId: 'test-user-id',
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth');
      
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/charts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', category: 'Test' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const { getServerSession } = await import('next-auth');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost:3000/api/charts', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Invalid: empty name, missing category
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle chart creation errors', async () => {
      const { getServerSession } = await import('next-auth');
      const { createChart } = await import('../../../lib/models/chart');
      
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(createChart).mockRejectedValue(new Error('Creation failed'));

      const request = new NextRequest('http://localhost:3000/api/charts', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Chart', category: 'Test' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});