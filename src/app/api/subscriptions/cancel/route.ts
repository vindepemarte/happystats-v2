/**
 * Subscription Cancellation API
 * Handles canceling subscriptions at period end
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { cancelStripeSubscription } from '../../../../lib/stripe';
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

    if (!user.stripeSubscriptionId || user.subscriptionTier === 'free') {
      return NextResponse.json(
        { error: 'No active subscription to cancel' },
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

    // Cancel subscription at period end in Stripe
    const canceledSubscription = await cancelStripeSubscription(user.stripeSubscriptionId);

    // Update user subscription status
    await updateUserSubscription(userId, {
      subscriptionStatus: 'canceled',
    });

    // Type assertion to handle Stripe's complex types
    const subscription = canceledSubscription as any;

    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the current period',
      endsAt: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}