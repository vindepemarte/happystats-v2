// Enhanced Subscription information API endpoint

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getSubscriptionInfo } from '../../../../lib/middleware/subscription';
import { getStripeSubscription, stripe } from '../../../../lib/stripe';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscriptionInfo = await getSubscriptionInfo(session.user.id);
    
    // Get the full user data to access stripeCustomerId
    const { getUserById } = await import('../../../../lib/models/user');
    const fullUser = await getUserById(session.user.id);
    
    // Get additional billing information if user has a Stripe subscription
    let billingInfo = null;
    if (fullUser?.stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripeSubscription = await getStripeSubscription(fullUser.stripeSubscriptionId);
        
        // Type assertion to handle Stripe's complex types
        const subscription = stripeSubscription as any;
        
        billingInfo = {
          currentPeriodEnd: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString() 
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          status: subscription.status || 'unknown',
        };
      } catch (error) {
        console.error('Error fetching billing info:', error);
        // Continue without billing info if Stripe call fails
        billingInfo = {
          hasActiveSubscription: false,
          error: 'Unable to fetch billing information'
        };
      }
    }

    const enhancedInfo = {
      ...subscriptionInfo,
      billing: billingInfo,
    };

    return NextResponse.json(enhancedInfo);

  } catch (error) {
    console.error('Subscription info error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription information' },
      { status: 500 }
    );
  }
}