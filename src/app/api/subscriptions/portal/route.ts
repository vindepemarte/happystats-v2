// Stripe billing portal API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getUserById } from '../../../../lib/models/user';
import { createBillingPortalSession } from '../../../../lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing information found' },
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

    // Create billing portal session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const portalSession = await createBillingPortalSession(
      user.stripeCustomerId,
      `${baseUrl}/subscription`
    );

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Billing portal creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}