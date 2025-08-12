/**
 * Subscription Downgrade API
 * Handles downgrading subscriptions to free tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { cancelStripeSubscription } from '../../../../lib/stripe';
import { updateUserSubscription } from '../../../../lib/models/user';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { targetTier } = await request.json();

    if (targetTier !== 'free') {
      return NextResponse.json(
        { error: 'Can only downgrade to free tier' },
        { status: 400 }
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

    // If user has an active Stripe subscription, cancel it (only if Stripe is configured)
    if (user.stripeSubscriptionId && user.subscriptionTier !== 'free' && process.env.STRIPE_SECRET_KEY) {
      try {
        await cancelStripeSubscription(user.stripeSubscriptionId);
      } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        // Continue with downgrade even if Stripe cancellation fails
      }
    }

    // Update user to free tier
    await updateUserSubscription(userId, {
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
    });

    return NextResponse.json({
      message: 'Successfully downgraded to free tier',
      newTier: 'free'
    });

  } catch (error) {
    console.error('Subscription downgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to downgrade subscription' },
      { status: 500 }
    );
  }
}