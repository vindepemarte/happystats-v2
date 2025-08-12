/**
 * Enhanced Subscription Manager Component
 * Handles subscription upgrades, downgrades, and billing management
 */

"use client";

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { SUBSCRIPTION_TIERS, formatPrice, getStripe, type SubscriptionTierName } from '../../lib/stripe';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ErrorDisplay, InlineError } from '../ui/ErrorComponents';
import { SubscriptionInfo } from '../../types/subscription';

interface SubscriptionManagerProps {
  subscriptionInfo: SubscriptionInfo;
  onSubscriptionChange: () => void;
}

export function SubscriptionManager({ subscriptionInfo, onSubscriptionChange }: SubscriptionManagerProps) {
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { error, handleError, clearError, executeWithErrorHandling } = useErrorHandler();

  const currentTier = subscriptionInfo.tier;
  const user = subscriptionInfo.user;
  const usage = subscriptionInfo.usage;
  const billing = subscriptionInfo.billing;

  const handleUpgrade = async (targetTier: 'monthly' | 'lifetime') => {
    await executeWithErrorHandling(async () => {
      setIsUpgrading(targetTier);
      
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tier: targetTier,
          currentTier: user.subscriptionTier 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      const stripe = await getStripe();
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    }, 'Subscription Upgrade');
    
    setIsUpgrading(null);
  };

  const handleDowngrade = async () => {
    await executeWithErrorHandling(async () => {
      const response = await fetch('/api/subscriptions/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: 'free' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to downgrade subscription');
      }

      setShowDowngradeModal(false);
      onSubscriptionChange();
    }, 'Subscription Downgrade');
  };

  const handleCancelSubscription = async () => {
    await executeWithErrorHandling(async () => {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }

      setShowCancelModal(false);
      onSubscriptionChange();
    }, 'Subscription Cancellation');
  };

  const handleReactivateSubscription = async () => {
    await executeWithErrorHandling(async () => {
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reactivate subscription');
      }

      onSubscriptionChange();
    }, 'Subscription Reactivation');
  };

  const handleManageBilling = async () => {
    await executeWithErrorHandling(async () => {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    }, 'Billing Portal');
  };

  if (error) {
    return <ErrorDisplay error={error} onRetry={clearError} />;
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Plan
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.subscriptionStatus === 'active' 
                ? 'bg-green-100 text-green-800' 
                : user.subscriptionStatus === 'canceled'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.subscriptionStatus === 'active' ? 'Active' : 
               user.subscriptionStatus === 'canceled' ? 'Canceled' : 
               user.subscriptionStatus}
            </span>
          </CardTitle>
          <CardDescription>Your current subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{currentTier.displayName}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTier.price === 0 
                  ? 'Free forever' 
                  : `${formatPrice(currentTier.price)} ${currentTier.interval ? `/ ${currentTier.interval}` : 'one-time'}`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {usage.chartCount}
              </div>
              <div className="text-sm text-muted-foreground">
                of {usage.chartLimit || '∞'} charts
              </div>
            </div>
          </div>

          {/* Usage Progress */}
          {usage.chartLimit && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Chart usage</span>
                <span>{Math.round((usage.chartCount / usage.chartLimit) * 100)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usage.chartCount >= usage.chartLimit ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min((usage.chartCount / usage.chartLimit) * 100, 100)}%` }}
                />
              </div>
              {usage.chartCount >= usage.chartLimit && (
                <p className="text-sm text-destructive">
                  You&apos;ve reached your chart limit. Upgrade to create more charts.
                </p>
              )}
            </div>
          )}

          {/* Billing Information */}
          {billing && user.subscriptionTier !== 'free' && (
            <div className="border-t pt-4 space-y-2">
              <h4 className="font-medium">Billing Information</h4>
              {billing.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {billing.cancelAtPeriodEnd 
                    ? `Subscription ends on ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
                    : `Next billing date: ${new Date(billing.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
              {billing.nextInvoiceAmount && !billing.cancelAtPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  Next charge: {formatPrice(billing.nextInvoiceAmount / 100)}
                </p>
              )}
              {billing.paymentMethod && (
                <p className="text-sm text-muted-foreground">
                  Payment method: {billing.paymentMethod.brand.toUpperCase()} ending in {billing.paymentMethod.last4}
                </p>
              )}
            </div>
          )}

          {/* Features List */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Features included:</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {currentTier.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          {user.subscriptionTier !== 'free' && (
            <Button variant="outline" onClick={handleManageBilling} className="flex-1">
              Manage Billing
            </Button>
          )}
          
          {user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active' && billing?.cancelAtPeriodEnd && (
            <Button onClick={handleReactivateSubscription} className="flex-1">
              Reactivate Subscription
            </Button>
          )}
          
          {user.subscriptionTier !== 'free' && user.subscriptionStatus === 'active' && !billing?.cancelAtPeriodEnd && (
            <Button variant="destructive" onClick={() => setShowCancelModal(true)} className="flex-1">
              Cancel Subscription
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Upgrade/Downgrade Options */}
      {user.subscriptionTier === 'free' && (
        <UpgradeOptions 
          onUpgrade={handleUpgrade} 
          isUpgrading={isUpgrading} 
        />
      )}

      {user.subscriptionTier === 'monthly' && (
        <div className="space-y-4">
          <UpgradeToLifetime onUpgrade={handleUpgrade} isUpgrading={isUpgrading} />
          <DowngradeOption onDowngrade={() => setShowDowngradeModal(true)} />
        </div>
      )}

      {user.subscriptionTier === 'lifetime' && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">You&apos;re all set!</h3>
            <p className="text-muted-foreground">
              You have lifetime access to all HappyStats features. Enjoy unlimited charts and all future updates!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Downgrade Confirmation Modal */}
      <Modal
        isOpen={showDowngradeModal}
        onClose={() => setShowDowngradeModal(false)}
        title="Confirm Downgrade"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to downgrade to the Free plan? You&apos;ll lose access to:
          </p>
          <ul className="space-y-1">
            <li className="flex items-center text-sm text-destructive">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Unlimited charts (limited to 3)
            </li>
            <li className="flex items-center text-sm text-destructive">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Priority support
            </li>
            <li className="flex items-center text-sm text-destructive">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Advanced features
            </li>
          </ul>
          {usage.chartCount > 3 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> You currently have {usage.chartCount} charts. 
                After downgrading, you&apos;ll only be able to access your first 3 charts.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDowngradeModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDowngrade} className="flex-1">
              Confirm Downgrade
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to cancel your subscription? 
          </p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Your subscription will remain active until {billing?.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : 'the end of your billing period'}. 
              You can reactivate anytime before then.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} className="flex-1">
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Upgrade Options Component
function UpgradeOptions({ 
  onUpgrade, 
  isUpgrading 
}: { 
  onUpgrade: (tier: 'monthly' | 'lifetime') => void;
  isUpgrading: string | null;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Upgrade Your Plan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Plan */}
        <Card className="relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
              Popular
            </span>
          </div>
          <CardHeader className="pt-8">
            <CardTitle>{SUBSCRIPTION_TIERS.monthly.displayName}</CardTitle>
            <CardDescription>
              <div className="text-2xl font-bold">
                {formatPrice(SUBSCRIPTION_TIERS.monthly.firstMonthPrice!)}
                <span className="text-sm font-normal text-muted-foreground"> first month</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Then {formatPrice(SUBSCRIPTION_TIERS.monthly.price)} / month
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {SUBSCRIPTION_TIERS.monthly.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => onUpgrade('monthly')}
              loading={isUpgrading === 'monthly'}
              disabled={!!isUpgrading}
            >
              Upgrade to Monthly
            </Button>
          </CardFooter>
        </Card>

        {/* Lifetime Plan */}
        <Card className="relative border-primary">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              Best Value
            </span>
          </div>
          <CardHeader className="pt-8">
            <CardTitle>{SUBSCRIPTION_TIERS.lifetime.displayName}</CardTitle>
            <CardDescription>
              <div className="text-2xl font-bold">
                {formatPrice(SUBSCRIPTION_TIERS.lifetime.price)}
                <span className="text-sm font-normal text-muted-foreground"> one-time</span>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Save over 80% vs monthly
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {SUBSCRIPTION_TIERS.lifetime.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => onUpgrade('lifetime')}
              loading={isUpgrading === 'lifetime'}
              disabled={!!isUpgrading}
            >
              Get Lifetime Access
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Upgrade to Lifetime Component
function UpgradeToLifetime({ 
  onUpgrade, 
  isUpgrading 
}: { 
  onUpgrade: (tier: 'lifetime') => void;
  isUpgrading: string | null;
}) {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Upgrade to Lifetime
        </CardTitle>
        <CardDescription>
          Save money and get lifetime access to all features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-700">
              {formatPrice(SUBSCRIPTION_TIERS.lifetime.price)}
            </div>
            <div className="text-sm text-green-600">
              One-time payment • Save over 80%
            </div>
          </div>
          <Button 
            onClick={() => onUpgrade('lifetime')}
            loading={isUpgrading === 'lifetime'}
            disabled={!!isUpgrading}
            className="bg-green-600 hover:bg-green-700"
          >
            Upgrade Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Downgrade Option Component
function DowngradeOption({ onDowngrade }: { onDowngrade: () => void }) {
  return (
    <Card className="border-yellow-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Need to downgrade?</h3>
            <p className="text-sm text-muted-foreground">
              Switch back to the free plan anytime
            </p>
          </div>
          <Button variant="outline" onClick={onDowngrade}>
            Downgrade to Free
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}