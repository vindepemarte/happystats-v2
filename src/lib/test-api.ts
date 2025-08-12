// Test API endpoints

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testRegistrationAPI() {
  try {
    console.log('🧪 Testing registration API...');
    
    const testData = {
      email: `api-test-${Date.now()}@happystats.com`,
      password: 'TestPassword123'
    };
    
    // Simulate the registration logic
    const { createUser, hashPassword, getUserByEmail } = await import('./models/user');
    const { z } = await import('zod');
    
    // Test validation schema
    const registerSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters long")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    });
    
    const validationResult = registerSchema.safeParse(testData);
    if (!validationResult.success) {
      throw new Error('Validation failed: ' + JSON.stringify(validationResult.error.errors));
    }
    
    console.log('✅ Input validation passed');
    
    // Check if user already exists
    const existingUser = await getUserByEmail(testData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    console.log('✅ User uniqueness check passed');
    
    // Hash password and create user
    const passwordHash = await hashPassword(testData.password);
    const user = await createUser({
      email: testData.email,
      passwordHash,
      subscriptionTier: 'free'
    });
    
    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      tier: user.subscriptionTier
    });
    
    console.log('\n🎉 Registration API logic test passed!');
    return true;
  } catch (error) {
    console.error('❌ Registration API test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testRegistrationAPI()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testRegistrationAPI };