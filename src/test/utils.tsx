/**
 * Test Utilities
 * Helper functions and components for testing
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorProvider } from '../components/providers/ErrorProvider';
import { PWAProvider } from '../components/providers/PWAProvider';

// Mock session data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockSession = {
  user: mockUser,
  expires: '2024-12-31',
};

// Mock subscription info
export const mockSubscriptionInfo = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
  },
  tier: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    currency: 'eur',
    interval: null,
    features: ['Up to 3 charts', 'Basic support'],
    chartLimit: 3,
  },
  usage: {
    chartCount: 1,
    chartLimit: 3,
    canCreateChart: true,
  },
};

// Mock chart data
export const mockChart = {
  id: 'test-chart-id',
  name: 'Test Chart',
  category: 'Test Category',
  userId: 'test-user-id',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  dataPoints: [
    {
      id: 'test-data-point-1',
      chartId: 'test-chart-id',
      measurement: 10,
      date: '2024-01-01',
      name: 'Test Point 1',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'test-data-point-2',
      chartId: 'test-chart-id',
      measurement: 20,
      date: '2024-01-02',
      name: 'Test Point 2',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
};

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <ErrorProvider>
      <PWAProvider>
        {children}
      </PWAProvider>
    </ErrorProvider>
  );
};

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
};

// Mock fetch with specific responses
export const mockFetch = (responses: Record<string, any>) => {
  const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const key = `${method} ${url}`;
    
    if (responses[key]) {
      return mockApiResponse(responses[key]);
    }
    
    // Default response
    return mockApiResponse({ error: 'Not found' }, 404);
  });
  
  global.fetch = fetchMock;
  return fetchMock;
};

// Mock successful API calls
export const mockSuccessfulApi = () => {
  return mockFetch({
    'GET /api/charts': { data: [mockChart] },
    'POST /api/charts': { data: mockChart },
    'GET /api/charts/test-chart-id': { data: mockChart },
    'PUT /api/charts/test-chart-id': { data: { ...mockChart, name: 'Updated Chart' } },
    'DELETE /api/charts/test-chart-id': { success: true },
    'GET /api/subscriptions/info': { data: mockSubscriptionInfo },
    'POST /api/subscriptions/checkout': { sessionId: 'test-session-id' },
  });
};

// Mock error API calls
export const mockErrorApi = (errorMessage = 'API Error') => {
  return mockFetch({
    'GET /api/charts': { error: errorMessage },
    'POST /api/charts': { error: errorMessage },
  });
};

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};

// Mock window.location
export const mockLocation = (url = 'http://localhost:3000/') => {
  const location = new URL(url);
  Object.defineProperty(window, 'location', {
    value: {
      ...location,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });
  return window.location;
};

// Create mock event
export const createMockEvent = (type: string, properties: Record<string, any> = {}) => {
  const event = new Event(type);
  Object.assign(event, properties);
  return event;
};

// Assert element has class
export const expectToHaveClass = (element: Element, className: string) => {
  expect(element).toHaveClass(className);
};

// Assert element is visible
export const expectToBeVisible = (element: Element) => {
  expect(element).toBeVisible();
};

// Assert element is hidden
export const expectToBeHidden = (element: Element) => {
  expect(element).not.toBeVisible();
};

export { customRender as render };
export * from '@testing-library/react';
export { vi } from 'vitest';