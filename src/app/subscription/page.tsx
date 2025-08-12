// Enhanced Subscription management page

"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import { ErrorDisplay } from '../../components/ui/ErrorComponents';
import { Header } from '../../components/layout/Header';
import { SubscriptionManager } from '../../components/subscription/SubscriptionManager';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { SubscriptionInfo } from '../../types/subscription';

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const { error, isLoading, executeWithErrorHandling } = useErrorHandler();

  // Check for canceled parameter
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchSubscriptionInfo();
  }, [session, status, router]);

  const fetchSubscriptionInfo = async () => {
    await executeWithErrorHandling(async () => {
      const response = await fetch('/api/subscriptions/info');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription information');
      }
      
      const result = await response.json();
      setSubscriptionInfo(result.data);
    }, 'Fetch Subscription Info');
  };

  if (status === 'loading' || isLoading) {
    return <LoadingPage message="Loading subscription information..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <ErrorDisplay
            error={error}
            title="Failed to Load Subscription"
            onRetry={fetchSubscriptionInfo}
          />
        </div>
      </div>
    );
  }

  if (!subscriptionInfo) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Manage your HappyStats subscription and billing
          </p>
        </div>

        {canceled && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-800">
                Upgrade canceled. You can upgrade anytime to unlock more features.
              </p>
            </div>
          </div>
        )}

        <SubscriptionManager 
          subscriptionInfo={subscriptionInfo}
          onSubscriptionChange={fetchSubscriptionInfo}
        />
      </div>
    </div>
  );
}