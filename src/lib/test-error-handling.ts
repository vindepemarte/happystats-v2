/**
 * Error Handling Test Suite
 * Tests comprehensive error handling functionality
 */

import { 
  createAppError, 
  handleError, 
  getUserFriendlyMessage,
  isRetryableError,
  requiresAuth,
  requiresUpgrade,
  ERROR_CODES 
} from './error-handler';

/**
 * Test error creation and handling
 */
export function testErrorHandling() {
  console.log('🧪 Testing Error Handling System...');

  // Test 1: Create app error
  console.log('📝 Testing error creation...');
  const appError = createAppError(
    ERROR_CODES.VALIDATION_ERROR,
    'Test validation error',
    { field: 'email', value: 'invalid' },
    400,
    'Test Context'
  );
  
  console.log('✅ App error created:', appError);

  // Test 2: Handle different error types
  console.log('🔄 Testing error handling...');
  
  const jsError = new Error('Test JavaScript error');
  const handledError = handleError(jsError, 'Test Context');
  console.log('✅ JavaScript error handled:', handledError);

  // Test 3: User-friendly messages
  console.log('💬 Testing user-friendly messages...');
  const friendlyMessage = getUserFriendlyMessage(appError);
  console.log('✅ Friendly message:', friendlyMessage);

  // Test 4: Error classification
  console.log('🏷️ Testing error classification...');
  console.log('Is retryable:', isRetryableError(appError));
  console.log('Requires auth:', requiresAuth(appError));
  console.log('Requires upgrade:', requiresUpgrade(appError));

  // Test 5: Different error codes
  console.log('🎯 Testing different error codes...');
  const authError = createAppError(ERROR_CODES.UNAUTHORIZED);
  const upgradeError = createAppError(ERROR_CODES.SUBSCRIPTION_REQUIRED);
  const networkError = createAppError(ERROR_CODES.NETWORK_ERROR);

  console.log('Auth error requires auth:', requiresAuth(authError));
  console.log('Upgrade error requires upgrade:', requiresUpgrade(upgradeError));
  console.log('Network error is retryable:', isRetryableError(networkError));

  console.log('🎉 Error handling test completed');
}

/**
 * Test API error responses
 */
export async function testApiErrorHandling() {
  console.log('🧪 Testing API Error Handling...');

  // Test different API scenarios
  const testCases = [
    { url: '/api/nonexistent', expectedStatus: 404 },
    { url: '/api/charts', method: 'POST', body: {}, expectedStatus: 400 }, // Invalid body
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing ${testCase.method || 'GET'} ${testCase.url}...`);
      
      const response = await fetch(testCase.url, {
        method: testCase.method || 'GET',
        headers: testCase.body ? { 'Content-Type': 'application/json' } : {},
        body: testCase.body ? JSON.stringify(testCase.body) : undefined,
      });

      if (response.status === testCase.expectedStatus) {
        console.log(`✅ Expected status ${testCase.expectedStatus} received`);
        
        const errorData = await response.json();
        console.log('Error response:', errorData);
      } else {
        console.log(`⚠️ Unexpected status: ${response.status} (expected ${testCase.expectedStatus})`);
      }
    } catch (error) {
      console.log('❌ Test failed:', error);
    }
  }

  console.log('🎉 API error handling test completed');
}

/**
 * Test error boundary functionality
 */
export function testErrorBoundary() {
  console.log('🧪 Testing Error Boundary...');

  // This would be used in a React component to test error boundary
  const TestComponent = () => {
    const throwError = () => {
      throw new Error('Test error boundary');
    };

    return (
      <div>
        <button onClick={throwError}>Throw Error</button>
      </div>
    );
  };

  console.log('✅ Error boundary test component created');
  console.log('💡 Use this component in a React app to test error boundary');

  return TestComponent;
}

/**
 * Simulate different error scenarios
 */
export function simulateErrors() {
  console.log('🧪 Simulating Different Error Scenarios...');

  const scenarios = [
    {
      name: 'Network Error',
      error: new Error('Failed to fetch'),
      expectedCode: ERROR_CODES.NETWORK_ERROR,
    },
    {
      name: 'Validation Error',
      error: { name: 'ValidationError', message: 'Invalid input' },
      expectedCode: ERROR_CODES.VALIDATION_ERROR,
    },
    {
      name: 'Not Found Error',
      error: new Error('Resource not found'),
      expectedCode: ERROR_CODES.NOT_FOUND,
    },
    {
      name: 'Unknown Error',
      error: 'Something went wrong',
      expectedCode: ERROR_CODES.UNKNOWN_ERROR,
    },
  ];

  scenarios.forEach(scenario => {
    console.log(`🎭 Simulating ${scenario.name}...`);
    const handledError = handleError(scenario.error, scenario.name);
    
    if (handledError.code === scenario.expectedCode) {
      console.log(`✅ ${scenario.name} handled correctly`);
    } else {
      console.log(`❌ ${scenario.name} handled incorrectly: expected ${scenario.expectedCode}, got ${handledError.code}`);
    }
  });

  console.log('🎉 Error simulation completed');
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).testErrorHandling = testErrorHandling;
  (window as Record<string, unknown>).testApiErrorHandling = testApiErrorHandling;
  (window as Record<string, unknown>).simulateErrors = simulateErrors;
}