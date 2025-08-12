/**
 * Offline Page
 * Shown when user is offline and tries to navigate to a page not in cache
 */

"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12" />
            </svg>
          </div>
        </div>

        {/* Title and Description */}
        <h1 className="text-2xl font-bold text-foreground mb-4">
          You&apos;re Offline
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry - you can still view your cached charts and data. Any changes you make will be synced when you&apos;re back online.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Offline Features */}
        <div className="mt-12 p-6 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            What you can do offline:
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              View your cached charts and data
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Add new data points (synced later)
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Edit existing charts (synced later)
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Export data to CSV
            </li>
          </ul>
        </div>

        {/* Connection Status */}
        <div className="mt-6 text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive"></div>
            <span>No internet connection</span>
          </div>
        </div>
      </div>
    </div>
  );
}