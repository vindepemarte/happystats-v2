/**
 * PWA Functionality Test
 * Tests offline capabilities and service worker registration
 */

import { 
  isOnline, 
  addPendingAction, 
  getPendingActions, 
  syncPendingActions,
  clearOfflineData 
} from './offline';

import { 
  registerServiceWorker, 
  requestBackgroundSync,
  isPWA 
} from './sw-registration';

/**
 * Test PWA functionality
 */
export async function testPWAFunctionality() {
  console.log('🧪 Testing PWA Functionality...');
  
  // Test 1: Check online status
  console.log('📡 Online status:', isOnline());
  
  // Test 2: Test pending actions
  console.log('📝 Testing pending actions...');
  
  // Clear any existing data
  clearOfflineData();
  
  // Add a test pending action
  addPendingAction({
    type: 'CREATE_CHART',
    data: { name: 'Test Chart', category: 'Test' }
  });
  
  const pendingActions = getPendingActions();
  console.log('📋 Pending actions:', pendingActions.length);
  
  // Test 3: Service Worker Registration
  console.log('🔧 Testing service worker registration...');
  try {
    const registration = await registerServiceWorker();
    if (registration) {
      console.log('✅ Service worker registered successfully');
      
      // Test background sync
      try {
        await requestBackgroundSync();
        console.log('✅ Background sync registered');
      } catch (error) {
        console.log('⚠️ Background sync failed:', error);
      }
    } else {
      console.log('❌ Service worker registration failed');
    }
  } catch (error) {
    console.log('❌ Service worker test failed:', error);
  }
  
  // Test 4: PWA Detection
  console.log('📱 Is PWA:', isPWA());
  
  // Test 5: Sync functionality (if online)
  if (isOnline()) {
    console.log('🔄 Testing sync functionality...');
    try {
      await syncPendingActions();
      console.log('✅ Sync completed');
    } catch (error) {
      console.log('⚠️ Sync failed:', error);
    }
  }
  
  console.log('🎉 PWA functionality test completed');
}

/**
 * Test offline API client
 */
export async function testOfflineAPI() {
  console.log('🧪 Testing Offline API Client...');
  
  const { chartApi } = await import('./api-client');
  
  // Test chart creation (should work offline)
  console.log('📊 Testing chart creation...');
  try {
    const result = await chartApi.create({
      name: 'Offline Test Chart',
      category: 'Test'
    });
    
    if (result.offline) {
      console.log('✅ Offline chart creation successful');
    } else if (result.data) {
      console.log('✅ Online chart creation successful');
    } else {
      console.log('❌ Chart creation failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Chart creation test failed:', error);
  }
  
  // Test chart listing (should return cached data if offline)
  console.log('📋 Testing chart listing...');
  try {
    const result = await chartApi.list();
    
    if (result.offline) {
      console.log('✅ Offline chart listing successful (cached data)');
    } else if (result.data) {
      console.log('✅ Online chart listing successful');
    } else {
      console.log('❌ Chart listing failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Chart listing test failed:', error);
  }
  
  console.log('🎉 Offline API test completed');
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).testPWA = testPWAFunctionality;
  (window as Record<string, unknown>).testOfflineAPI = testOfflineAPI;
}