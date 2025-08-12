// Shared subscription types

import { SUBSCRIPTION_TIERS, SubscriptionTierName } from '../lib/stripe';

export interface SubscriptionInfo {
  user: {
    id: string;
    email: string;
    subscriptionTier: string;
    subscriptionStatus: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  tier: typeof SUBSCRIPTION_TIERS[SubscriptionTierName];
  usage: {
    chartCount: number;
    chartLimit: number | null;
    canCreateChart: boolean;
  };
  billing?: {
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    nextInvoiceAmount?: number;
    paymentMethod?: {
      brand: string;
      last4: string;
    };
    status?: string;
    hasActiveSubscription?: boolean;
    error?: string;
  };
}

// Helper function to get subscription limits
export function getSubscriptionLimits(tier: string) {
  const tierName = tier as SubscriptionTierName;
  return SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.free;
}