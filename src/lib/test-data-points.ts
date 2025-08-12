// Test data point management functionality

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testDataPointManagement() {
  try {
    console.log('🧪 Testing data point management system...');
    
    // Test data point model functions
    const { createChart, createDataPoint, updateDataPoint, deleteDataPoint } = await import('./models/chart');
    const { createUser, hashPassword } = await import('./models/user');
    
    // Create a test user and chart for data point operations
    const hashedPassword = await hashPassword('TestPassword123');
    const testUser = await createUser({
      email: `datapoint-test-${Date.now()}@happystats.com`,
      passwordHash: hashedPassword,
      subscriptionTier: 'free'
    });
    
    const testChart = await createChart({
      userId: testUser.id,
      name: 'Test Data Point Chart',
      category: 'Testing'
    });
    
    console.log('✅ Test user and chart created for data point testing');
    
    // Test data point creation
    const testDataPoint = await createDataPoint({
      chartId: testChart.id,
      measurement: 75.5,
      date: new Date('2024-01-01'),
      name: 'Test measurement'
    });
    
    console.log('✅ Data point created successfully:', testDataPoint.id);
    
    // Test data point update
    const updatedDataPoint = await updateDataPoint(testDataPoint.id, {
      measurement: 76.0,
      name: 'Updated test measurement'
    });
    
    console.log('✅ Data point update works:', updatedDataPoint?.measurement === 76);
    
    // Test validation utilities
    const { validateMeasurement, validateDate, validateDataPointName } = await import('./validation');
    
    const measurementValidation = validateMeasurement('75.5');
    console.log('✅ Measurement validation works:', measurementValidation.isValid);
    
    const dateValidation = validateDate(new Date('2024-01-01'));
    console.log('✅ Date validation works:', dateValidation.isValid);
    
    const nameValidation = validateDataPointName('Test name');
    console.log('✅ Name validation works:', nameValidation.isValid);
    
    // Test invalid validations
    const invalidMeasurement = validateMeasurement('not-a-number');
    console.log('✅ Invalid measurement detection works:', !invalidMeasurement.isValid);
    
    const futureDate = validateDate(new Date('2030-01-01'));
    console.log('✅ Future date detection works:', !futureDate.isValid);
    
    // Test component imports
    const { DataPointForm, QuickAddDataPoint } = await import('../components/charts/DataPointForm');
    const { DataPointList } = await import('../components/charts/DataPointList');
    
    console.log('✅ All data point components can be imported successfully');
    
    // Test API endpoint imports
    const dataPointsRoute = await import('../app/api/charts/[id]/data-points/route');
    const dataPointByIdRoute = await import('../app/api/data-points/[id]/route');
    
    console.log('✅ All data point API endpoints can be imported successfully');
    
    // Test data point deletion (cleanup)
    const deleted = await deleteDataPoint(testDataPoint.id);
    console.log('✅ Data point deletion works:', deleted);
    
    // Test batch validation
    const { validateDataPoints } = await import('./validation');
    const testBatch = [
      { measurement: 75.5, date: new Date(), name: 'Valid point' },
      { measurement: 'invalid', date: new Date(), name: 'Invalid point' },
    ];
    
    const batchResult = validateDataPoints(testBatch);
    console.log('✅ Batch validation works:', batchResult.valid.length === 1 && batchResult.invalid.length === 1);
    
    console.log('\n🎉 Data point management system test completed!');
    return true;
  } catch (error) {
    console.error('❌ Data point management test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDataPointManagement()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testDataPointManagement };