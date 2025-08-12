"use client";

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { LoadingPage } from '../components/ui/LoadingSpinner';
import { Header } from '../components/layout/Header';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <LoadingPage message="Loading..." />
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
              Track Your Progress with{' '}
              <span className="text-primary">HappyStats</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your personal data into beautiful, interactive charts. Visualize trends, track progress, and make data-driven decisions with our mobile-first analytics platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                Start Free Today
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="pt-4 text-sm text-muted-foreground">
            Free forever • No credit card required • 3 charts included
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="container py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Track What Matters
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed for mobile-first data visualization and analysis
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Interactive Charts
            </h3>
            <p className="text-sm text-muted-foreground">
              Beautiful, responsive charts that adapt perfectly to any screen size with automatic trend line analysis
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-chart-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Smart Trend Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              Automatic trend line calculation using linear regression to identify patterns and insights in your data
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-chart-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Mobile-First Design
            </h3>
            <p className="text-sm text-muted-foreground">
              Optimized for mobile devices starting at 312px width with PWA support for offline access
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-chart-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              CSV Import & Export
            </h3>
            <p className="text-sm text-muted-foreground">
              Easily import existing data from CSV files or export your charts for backup and analysis
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-chart-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Advanced Filtering
            </h3>
            <p className="text-sm text-muted-foreground">
              Filter your data by date ranges, categories, and custom criteria to focus on what matters most
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-chart-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">
              Secure & Private
            </h3>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and secure. We never share your personal information with third parties
            </p>
          </div>
        </div>
      </section>

      {/* AI Assistant Teaser */}
      <section className="container py-16 sm:py-20">
        <div className="bg-gradient-to-r from-primary/10 via-chart-1/10 to-chart-2/10 rounded-2xl p-8 sm:p-12 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              AI Assistant Coming Soon
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Get ready for intelligent insights! Our upcoming AI assistant will analyze your data patterns, suggest optimizations, and provide personalized recommendations to help you achieve your goals faster.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Early access for lifetime members
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free and upgrade when you're ready for more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Free</h3>
              <div className="text-3xl font-bold text-foreground mb-1">€0</div>
              <div className="text-sm text-muted-foreground">Forever free</div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Up to 3 charts
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited data points
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Trend line analysis
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                CSV import & export
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mobile PWA support
              </li>
            </ul>
            <Link href="/auth/register" className="block">
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Monthly Tier */}
          <div className="p-6 bg-card rounded-lg border-2 border-primary hover:shadow-lg transition-shadow relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            </div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Monthly</h3>
              <div className="text-3xl font-bold text-foreground mb-1">€9.99</div>
              <div className="text-sm text-muted-foreground">per month after €1 first month</div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited charts
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All free features
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced filtering
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Bulk data operations
              </li>
            </ul>
            <Link href="/auth/register" className="block">
              <Button className="w-full">
                Start €1 Trial
              </Button>
            </Link>
          </div>

          {/* Lifetime Tier */}
          <div className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Lifetime</h3>
              <div className="text-3xl font-bold text-foreground mb-1">€99.99</div>
              <div className="text-sm text-muted-foreground">One-time payment</div>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Everything in Monthly
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lifetime access
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Super support
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                All future features
              </li>
              <li className="flex items-center gap-2 text-sm">
                <svg className="h-4 w-4 text-chart-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-chart-1 font-medium">Early AI assistant access</span>
              </li>
            </ul>
            <Link href="/auth/register" className="block">
              <Button variant="outline" className="w-full">
                Get Lifetime Access
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          All plans include a 30-day money-back guarantee
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container py-16 sm:py-20">
        <div className="bg-primary/5 rounded-2xl p-8 sm:p-12 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Data?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Join thousands of users who are already making better decisions with HappyStats. Start tracking your progress today with our free plan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                  Start Your Free Account
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3 text-lg">
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t">
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 HappyStats. Built with ❤️ for data enthusiasts.</p>
          <div className="mt-2 space-x-4">
            <span>Next.js 14</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>PWA Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
