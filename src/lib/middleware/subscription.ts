// Subscription middleware for checking limits and status

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from './auth';
import { getUserChartCount } from '../models/user';
import { SUBSCRIPTION_TIERS, canCreateChart } from '../stripe';

// Middleware to check if user can create charts
export async function withChartLimit(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check chart creation limit for free tier users
    if (user.subscriptionTier === 'free') {
      const chartCount = await getUserChartCount(user.id);
      const tier = SUBSCRIPTION_TIERS[user.subscriptionTier];
      
      if (chartCount >= (tier.chartLimit || 0)) {
        return NextResponse.json(
          { 
            error: 'Chart limit reached',
            message: 'You have reached the maximum number of charts for your subscription tier.',
            currentCount: chartCount,
            limit: tier.chartLimit,
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    return await handler(request, user);
  } catch (error) {
    console.error('Chart limit middleware error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    );
  }
}

// Middleware to check subscription status
export async function withActiveSubscription(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if subscription is active
    if (user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        { 
          error: 'Subscription required',
          message: 'This feature requires an active subscription.',
          subscriptionStatus: user.subscriptionStatus,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    return await handler(request, user);
  } catch (error) {
    console.error('Subscription status middleware error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}

// Helper function to get subscription info for a user
export async function getSubscriptionInfo(userId: string) {
  try {
    const { getUserById } = await import('../models/user');
    const { getSubscriptionByUserId } = await import('../models/subscription');
    
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await getSubscriptionByUserId(userId);
    const tier = SUBSCRIPTION_TIERS[user.subscriptionTier];
    const chartCount = await getUserChartCount(userId);

    return {
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
      },
      subscription,
      tier,
      usage: {
        chartCount,
        chartLimit: tier.chartLimit,
        canCreateChart: canCreateChart(user.subscriptionTier, chartCount),
      },
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    throw error;
  }
}

// Middleware to add subscription info to request
export async function withSubscriptionInfo(
  request: NextRequest,
  handler: (request: NextRequest, user: any, subscriptionInfo: any) => Promise<NextResponse>
) {
  try {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscriptionInfo = await getSubscriptionInfo(user.id);
    
    return await handler(request, user, subscriptionInfo);
  } catch (error) {
    console.error('Subscription info middleware error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription information' },
      { status: 500 }
    );
  }
}