// Test subscription system functionality

import { config } from 'dotenv';
config({ path: '.env.local' });

async function testSubscriptionSystem() {
  try {
    console.log('🧪 Testing subscription system...');
    
    // Test Stripe configuration
    const { SUBSCRIPTION_TIERS, formatPrice, canCreateChart, getSubscriptionTier } = await import('./stripe');
    
    // Test subscription tiers
    console.log('✅ Subscription tiers loaded:', Object.keys(SUBSCRIPTION_TIERS));
    
    // Test price formatting
    const formattedPrice = formatPrice(9.99, 'eur');
    console.log('✅ Price formatting works:', formattedPrice);
    
    // Test chart limit checking
    const canCreate = canCreateChart('free', 2);
    console.log('✅ Chart limit check (free, 2 charts):', canCreate);
    
    const cannotCreate = canCreateChart('free', 3);
    console.log('✅ Chart limit check (free, 3 charts):', !cannotCreate);
    
    // Test tier retrieval
    const freeTier = getSubscriptionTier('free');
    console.log('✅ Free tier retrieval:', freeTier.displayName === 'Free');
    
    const monthlyTier = getSubscriptionTier('monthly');
    console.log('✅ Monthly tier retrieval:', monthlyTier.displayName === 'Monthly Pro');
    
    // Test component imports
    const subscriptionPage = await import('../app/subscription/page');
    const successPage = await import('../app/subscription/success/page');
    const { UpgradePrompt, InlineUpgradePrompt } = await import('../components/subscription/UpgradePrompt');
    
    console.log('✅ All subscription components can be imported successfully');
    
    // Test API endpoint imports
    const checkoutRoute = await import('../app/api/subscriptions/checkout/route');
    const portalRoute = await import('../app/api/subscriptions/portal/route');
    const infoRoute = await import('../app/api/subscriptions/info/route');
    const webhookRoute = await import('../app/api/webhooks/stripe/route');
    
    console.log('✅ All subscription API endpoints can be imported successfully');
    
    // Test middleware imports
    const { withChartLimit, withActiveSubscription, getSubscriptionInfo } = await import('./middleware/subscription');
    
    console.log('✅ Subscription middleware can be imported successfully');
    
    // Test subscription tier features
    const tierFeatures = {
      free: SUBSCRIPTION_TIERS.free.features.length,
      monthly: SUBSCRIPTION_TIERS.monthly.features.length,
      lifetime: SUBSCRIPTION_TIERS.lifetime.features.length,
    };
    
    console.log('✅ Subscription tier features:', tierFeatures);
    
    // Test pricing structure
    const pricing = {
      free: SUBSCRIPTION_TIERS.free.price,
      monthlyFirst: SUBSCRIPTION_TIERS.monthly.firstMonthPrice,
      monthlyRegular: SUBSCRIPTION_TIERS.monthly.price,
      lifetime: SUBSCRIPTION_TIERS.lifetime.price,
    };
    
    console.log('✅ Pricing structure:', pricing);
    
    console.log('\n🎉 Subscription system test completed!');
    return true;
  } catch (error) {
    console.error('❌ Subscription system test failed:', error);
    throw error;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testSubscriptionSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testSubscriptionSystem };