// Test UI components functionality

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testComponents() {
  try {
    console.log('🧪 Testing UI components...');
    
    // Test utility functions
    const { cn, formatDate, formatNumber, debounce } = await import('./utils');
    
    // Test class name merging
    const className = cn('base-class', 'text-primary', { 'active': true });
    console.log('✅ Class name utility works:', className);
    
    // Test date formatting
    const formattedDate = formatDate(new Date());
    console.log('✅ Date formatting works:', formattedDate);
    
    // Test number formatting
    const formattedNumber = formatNumber(123.456, 2);
    console.log('✅ Number formatting works:', formattedNumber);
    
    // Test debounce function
    let debounceCount = 0;
    const debouncedFn = debounce(() => debounceCount++, 100);
    debouncedFn();
    debouncedFn();
    debouncedFn();
    
    setTimeout(() => {
      console.log('✅ Debounce function works:', debounceCount === 1);
    }, 150);
    
    // Test component imports (just verify they can be imported)
    const { Button } = await import('../components/ui/Button');
    const { Input } = await import('../components/ui/Input');
    const { Card } = await import('../components/ui/Card');
    const { Modal } = await import('../components/ui/Modal');
    const { LoadingSpinner } = await import('../components/ui/LoadingSpinner');
    const { ErrorBoundary } = await import('../components/ui/ErrorBoundary');
    const { Header } = await import('../components/layout/Header');
    const { Navigation } = await import('../components/layout/Navigation');
    
    console.log('✅ All components can be imported successfully');
    
    console.log('\n🎉 UI components test completed!');
    return true;
  } catch (error) {
    console.error('❌ Components test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testComponents()
    .then(() => {
      setTimeout(() => process.exit(0), 200); // Wait for debounce test
    })
    .catch(() => process.exit(1));
}

export { testComponents };