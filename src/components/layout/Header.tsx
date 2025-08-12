// Header component with mobile-first navigation

"use client";

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">H</span>
          </div>
          <span className="font-bold text-xl text-foreground">HappyStats</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {status === 'authenticated' ? (
            <>
              <Link
                href="/dashboard"
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/charts"
                className="text-foreground hover:text-primary transition-colors"
              >
                Charts
              </Link>
              <Link
                href="/subscription"
                className="text-foreground hover:text-primary transition-colors"
              >
                Subscription
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/features"
                className="text-foreground hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-foreground hover:text-primary transition-colors"
              >
                Pricing
              </Link>
            </>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {status === 'loading' ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          ) : status === 'authenticated' ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">
                {session?.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-10 w-10 p-0"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg
            className={cn('h-6 w-6 transition-transform', isMobileMenuOpen && 'rotate-90')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 space-y-4">
            {/* Navigation Links */}
            <nav className="space-y-3">
              {status === 'authenticated' ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/charts"
                    className="block text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Charts
                  </Link>
                  <Link
                    href="/subscription"
                    className="block text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Subscription
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/features"
                    className="block text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="block text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                </>
              )}
            </nav>

            {/* Auth Buttons */}
            <div className="pt-4 border-t border-border space-y-3">
              {status === 'loading' ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : status === 'authenticated' ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Signed in as {session?.user?.email}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="block">
                    <Button className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export { Header };