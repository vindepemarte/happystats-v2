// Stripe checkout session creation API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getUserById, updateUser } from '../../../../lib/models/user';
import { createStripeCustomer, createCheckoutSession, SUBSCRIPTION_TIERS } from '../../../../lib/stripe';
import { z } from 'zod';

const checkoutSchema = z.object({
  tier: z.enum(['monthly', 'lifetime']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = checkoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { tier } = validationResult.data;
    const user = await getUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a paid subscription
    if (user.subscriptionTier !== 'free') {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Create Stripe customer if doesn't exist
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(user.email);
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await updateUser(user.id, { stripeCustomerId });
    }

    // Get subscription tier configuration
    const subscriptionTier = SUBSCRIPTION_TIERS[tier];
    if (!subscriptionTier.stripePriceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: subscriptionTier.stripePriceId,
      successUrl: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tier,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}