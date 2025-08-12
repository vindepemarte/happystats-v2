// Subscription success page

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import { LoadingPage } from '../../../components/ui/LoadingSpinner';
import { Header } from '../../../components/layout/Header';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      router.push('/subscription');
      return;
    }

    // In a real implementation, you might want to verify the session
    // For now, we'll just show the success message
    setIsLoading(false);
  }, [sessionId, router]);

  if (isLoading) {
    return <LoadingPage message="Processing your subscription..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-green-800">
                Subscription Successful!
              </CardTitle>
              <CardDescription>
                Welcome to HappyStats Pro! Your subscription is now active.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">What's next?</h3>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Create unlimited charts</li>
                  <li>• Import data from CSV files</li>
                  <li>• Access advanced analytics</li>
                  <li>• Get priority support</li>
                </ul>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  You'll receive a confirmation email shortly with your receipt and subscription details.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3">
              <Link href="/dashboard" className="w-full">
                <Button className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              
              <Link href="/subscription" className="w-full">
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}