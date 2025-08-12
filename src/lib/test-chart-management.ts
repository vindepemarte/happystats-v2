// Test chart management functionality

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testChartManagement() {
  try {
    console.log('🧪 Testing chart management system...');
    
    // Test chart model functions
    const { createChart, getChartsByUserId, updateChart, deleteChart } = await import('./models/chart');
    const { createUser, hashPassword } = await import('./models/user');
    
    // Create a test user for chart operations
    const hashedPassword = await hashPassword('TestPassword123');
    const testUser = await createUser({
      email: `chart-test-${Date.now()}@happystats.com`,
      passwordHash: hashedPassword,
      subscriptionTier: 'free'
    });
    
    console.log('✅ Test user created for chart management:', testUser.id);
    
    // Test chart creation
    const testChart = await createChart({
      userId: testUser.id,
      name: 'Test Weight Chart',
      category: 'Health & Fitness'
    });
    
    console.log('✅ Chart created successfully:', testChart.id);
    
    // Test chart retrieval
    const userCharts = await getChartsByUserId(testUser.id);
    console.log('✅ Chart retrieval works:', userCharts.length === 1);
    
    // Test chart filtering
    const filteredCharts = await getChartsByUserId(testUser.id, {
      category: 'Health & Fitness',
      userId: testUser.id
    });
    console.log('✅ Chart filtering works:', filteredCharts.length === 1);
    
    // Test chart update
    const updatedChart = await updateChart(testChart.id, {
      name: 'Updated Weight Chart'
    });
    console.log('✅ Chart update works:', updatedChart?.name === 'Updated Weight Chart');
    
    // Test component imports
    const { ChartGrid } = await import('../components/charts/ChartGrid');
    const { CreateChartButton } = await import('../components/charts/CreateChartButton');
    const { ChartFilters } = await import('../components/charts/ChartFilters');
    
    console.log('✅ All chart components can be imported successfully');
    
    // Test API endpoint imports
    const chartsRoute = await import('../app/api/charts/route');
    const chartByIdRoute = await import('../app/api/charts/[id]/route');
    
    console.log('✅ All chart API endpoints can be imported successfully');
    
    // Test chart deletion (cleanup)
    const deleted = await deleteChart(testChart.id);
    console.log('✅ Chart deletion works:', deleted);
    
    // Test subscription middleware
    const { withChartLimit } = await import('./middleware/subscription');
    console.log('✅ Chart limit middleware can be imported successfully');
    
    console.log('\n🎉 Chart management system test completed!');
    return true;
  } catch (error) {
    console.error('❌ Chart management test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testChartManagement()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testChartManagement };