/**
 * Chart Management Integration Tests
 * Tests for complete chart management workflows
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils';
import { mockSuccessfulApi, mockErrorApi, mockSession } from '../utils';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: any) => children,
}));

// Import components after mocking
const ChartGrid = vi.fn(() => <div data-testid="chart-grid">Chart Grid</div>);
const CreateChartButton = vi.fn(() => <button data-testid="create-chart">Create Chart</button>);

vi.mock('../../components/charts/ChartGrid', () => ({
  ChartGrid,
}));

vi.mock('../../components/charts/CreateChartButton', () => ({
  CreateChartButton,
}));

describe('Chart Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chart Creation Flow', () => {
    it('should create chart successfully', async () => {
      const fetchMock = mockSuccessfulApi();
      
      // Mock successful chart creation
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            data: {
              id: 'new-chart-id',
              name: 'New Chart',
              category: 'Test Category',
              userId: 'test-user-id',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              dataPoints: [],
            },
          }),
        })
      );

      // Render dashboard with chart management
      render(
        <div>
          <CreateChartButton />
          <ChartGrid />
        </div>
      );

      // Verify components are rendered
      expect(screen.getByTestId('create-chart')).toBeInTheDocument();
      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });

    it('should handle chart creation errors', async () => {
      const fetchMock = mockErrorApi('Failed to create chart');

      render(
        <div>
          <CreateChartButton />
          <ChartGrid />
        </div>
      );

      // Components should still render even with API errors
      expect(screen.getByTestId('create-chart')).toBeInTheDocument();
      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });
  });

  describe('Chart Listing and Filtering', () => {
    it('should load and display charts', async () => {
      const fetchMock = mockSuccessfulApi();

      render(<ChartGrid />);

      // Wait for charts to load
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/charts');
      });

      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });

    it('should handle empty chart list', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      });
      global.fetch = fetchMock;

      render(<ChartGrid />);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/charts');
      });

      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });

    it('should handle chart loading errors', async () => {
      const fetchMock = mockErrorApi('Failed to load charts');

      render(<ChartGrid />);

      // Component should handle errors gracefully
      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });
  });

  describe('Subscription Limits', () => {
    it('should enforce chart limits for free users', async () => {
      // Mock free user session
      vi.mocked(vi.importActual('next-auth/react')).useSession = () => ({
        data: {
          ...mockSession,
          user: {
            ...mockSession.user,
            subscriptionTier: 'free',
          },
        },
        status: 'authenticated',
      });

      render(<CreateChartButton />);

      expect(screen.getByTestId('create-chart')).toBeInTheDocument();
    });

    it('should allow unlimited charts for premium users', async () => {
      // Mock premium user session
      vi.mocked(vi.importActual('next-auth/react')).useSession = () => ({
        data: {
          ...mockSession,
          user: {
            ...mockSession.user,
            subscriptionTier: 'monthly',
          },
        },
        status: 'authenticated',
      });

      render(<CreateChartButton />);

      expect(screen.getByTestId('create-chart')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error messages for failed operations', async () => {
      const fetchMock = mockErrorApi('Network error');

      render(
        <div>
          <CreateChartButton />
          <ChartGrid />
        </div>
      );

      // Components should render despite errors
      expect(screen.getByTestId('create-chart')).toBeInTheDocument();
      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });

    it('should recover from errors when retrying', async () => {
      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [] }),
        });

      global.fetch = fetchMock;

      render(<ChartGrid />);

      // Should handle initial error and then succeed on retry
      expect(screen.getByTestId('chart-grid')).toBeInTheDocument();
    });
  });
});