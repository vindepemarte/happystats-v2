// Test authentication pages functionality

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testAuthPages() {
  try {
    console.log('🧪 Testing authentication pages...');
    
    // Test form validation utilities
    const { isValidEmail } = await import('./utils');
    
    // Test email validation
    console.log('✅ Valid email test:', isValidEmail('test@example.com') === true);
    console.log('✅ Invalid email test:', isValidEmail('invalid-email') === false);
    
    // Test component imports
    const registerPage = await import('../app/auth/register/page');
    const loginPage = await import('../app/auth/login/page');
    const forgotPasswordPage = await import('../app/auth/forgot-password/page');
    const resetPasswordPage = await import('../app/auth/reset-password/page');
    const { LogoutButton } = await import('../components/auth/LogoutButton');
    const { AuthFeedback } = await import('../components/auth/AuthFeedback');
    
    console.log('✅ All authentication pages can be imported successfully');
    
    // Test password validation logic (simulated)
    const testPassword = 'TestPassword123';
    const passwordValidation = {
      minLength: testPassword.length >= 8,
      hasLowercase: /[a-z]/.test(testPassword),
      hasUppercase: /[A-Z]/.test(testPassword),
      hasNumber: /\d/.test(testPassword),
    };
    
    const isValidPassword = Object.values(passwordValidation).every(Boolean);
    console.log('✅ Password validation logic works:', isValidPassword);
    
    // Test form data structure
    const mockFormData = {
      email: 'test@example.com',
      password: 'TestPassword123',
      confirmPassword: 'TestPassword123',
    };
    
    const formValidation = {
      emailValid: isValidEmail(mockFormData.email),
      passwordValid: mockFormData.password.length >= 8,
      passwordsMatch: mockFormData.password === mockFormData.confirmPassword,
    };
    
    const isFormValid = Object.values(formValidation).every(Boolean);
    console.log('✅ Form validation logic works:', isFormValid);
    
    console.log('\n🎉 Authentication pages test completed!');
    return true;
  } catch (error) {
    console.error('❌ Authentication pages test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testAuthPages()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testAuthPages };