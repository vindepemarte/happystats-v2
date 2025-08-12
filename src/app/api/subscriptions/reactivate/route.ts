/**
 * Subscription Reactivation API
 * Handles reactivating canceled subscriptions
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { reactivateStripeSubscription } from '../../../../lib/stripe';
import { updateUserSubscription } from '../../../../lib/models/user';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get current user subscription info
    const { getUserById } = await import('../../../../lib/models/user');
    const user = await getUserById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'canceled') {
      return NextResponse.json(
        { error: 'No canceled subscription to reactivate' },
        { status: 400 }
      );
    }

    // Only proceed if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    // Reactivate subscription in Stripe
    const reactivatedSubscription = await reactivateStripeSubscription(user.stripeSubscriptionId);

    // Update user subscription status
    await updateUserSubscription(userId, {
      subscriptionStatus: 'active',
    });

    // Type assertion to handle Stripe's complex types
    const subscription = reactivatedSubscription as any;

    return NextResponse.json({
      message: 'Subscription reactivated successfully',
      status: 'active',
      nextBillingDate: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null
    });

  } catch (error) {
    console.error('Subscription reactivation error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}