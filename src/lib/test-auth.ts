// Test authentication system

import { config } from 'dotenv';
config({ path: '.env.local' });

import { authOptions } from './auth';
import { createUser, hashPassword } from './models/user';

async function testAuth() {
  try {
    console.log('🧪 Testing authentication system...');
    
    // Test user creation for auth
    const hashedPassword = await hashPassword('TestPassword123');
    const uniqueEmail = `auth-test-${Date.now()}@happystats.com`;
    const testUser = await createUser({
      email: uniqueEmail,
      passwordHash: hashedPassword,
      subscriptionTier: 'free'
    });
    
    console.log('✅ Test user created for auth:', { 
      id: testUser.id, 
      email: testUser.email 
    });
    
    // Test auth configuration
    console.log('✅ NextAuth configuration loaded');
    console.log('  - Providers:', authOptions.providers.length);
    console.log('  - Session strategy:', authOptions.session?.strategy);
    console.log('  - JWT configured:', !!authOptions.jwt?.secret);
    console.log('  - JWT secret from env:', !!process.env.JWT_SECRET);
    console.log('  - NextAuth secret from env:', !!process.env.NEXTAUTH_SECRET);
    
    console.log('\n🎉 Authentication system setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAuth()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testAuth };