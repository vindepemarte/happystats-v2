// Stripe configuration and utilities

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_') 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  : null;

// Client-side Stripe instance
let stripePromise: ReturnType<typeof loadStripe>;
export const getStripe = () => {
  if (!stripePromise && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Subscription tier configurations
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    currency: 'eur',
    interval: null,
    features: [
      'Up to 3 charts',
      'Basic support',
      'Data export',
      'Mobile app access'
    ],
    chartLimit: 3,
    stripePriceId: null,
  },
  monthly: {
    name: 'monthly',
    displayName: 'Monthly Pro',
    price: 9.99,
    currency: 'eur',
    interval: 'month' as const,
    features: [
      'Unlimited charts',
      'Priority support',
      'Data import/export',
      'Advanced analytics',
      'Custom categories',
      'Data filtering'
    ],
    chartLimit: null, // unlimited
    stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID,
    firstMonthPrice: 1.00, // Special first month pricing
  },
  lifetime: {
    name: 'lifetime',
    displayName: 'Lifetime Pro',
    price: 99.99,
    currency: 'eur',
    interval: null,
    features: [
      'Unlimited charts',
      'Super support',
      'Data import/export',
      'Advanced analytics',
      'Custom categories',
      'Data filtering',
      'All future features',
      'Priority feature requests'
    ],
    chartLimit: null, // unlimited
    stripePriceId: process.env.STRIPE_LIFETIME_PRICE_ID,
  },
} as const;

export type SubscriptionTierName = keyof typeof SUBSCRIPTION_TIERS;

// Helper functions
export function getSubscriptionTier(tierName: string) {
  return SUBSCRIPTION_TIERS[tierName as SubscriptionTierName] || SUBSCRIPTION_TIERS.free;
}

export function canCreateChart(tierName: string, currentChartCount: number): boolean {
  const tier = getSubscriptionTier(tierName);
  if (tier.chartLimit === null) return true; // unlimited
  return currentChartCount < tier.chartLimit;
}

export function formatPrice(price: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(price);
}

// Create Stripe customer
export async function createStripeCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'happystats',
      },
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create customer');
  }
}

// Create checkout session for subscription
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: priceId === SUBSCRIPTION_TIERS.lifetime.stripePriceId ? 'payment' : 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Create billing portal session
export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw new Error('Failed to create billing portal session');
  }
}

// Get subscription by ID
export async function getStripeSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw new Error('Failed to retrieve subscription');
  }
}

// Cancel subscription
export async function cancelStripeSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Reactivate subscription
export async function reactivateStripeSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw new Error('Failed to reactivate subscription');
  }
}