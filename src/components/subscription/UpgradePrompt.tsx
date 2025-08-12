// Upgrade prompt component for subscription limits

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Modal, ModalFooter } from '../ui/Modal';
import { SUBSCRIPTION_TIERS, formatPrice, getStripe } from '../../lib/stripe';
import type { Stripe } from '@stripe/stripe-js';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    currentCount?: number;
    limit?: number;
    feature?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    isOpen,
    onClose,
    title = "Upgrade Required",
    message = "You've reached the limit for your current plan.",
    currentCount,
    limit,
    feature = "charts",
}) => {
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

    const handleUpgrade = async (tier: 'monthly' | 'lifetime') => {
        try {
            setIsUpgrading(tier);

            const response = await fetch('/api/subscriptions/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tier }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const { sessionId } = await response.json();

            // Redirect to Stripe Checkout
            const stripe = await getStripe();
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    throw new Error(error.message || 'Failed to redirect to checkout');
                }
            } else {
                throw new Error('Failed to load Stripe');
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            // Handle error (could show toast notification)
        } finally {
            setIsUpgrading(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="lg"
        >
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>

                    <p className="text-muted-foreground mb-4">{message}</p>

                    {currentCount !== undefined && limit !== undefined && (
                        <div className="bg-muted rounded-lg p-4 mb-4">
                            <div className="text-sm text-muted-foreground mb-1">Current usage</div>
                            <div className="text-2xl font-bold">
                                {currentCount} / {limit} {feature}
                            </div>
                            <div className="w-full bg-background rounded-full h-2 mt-2">
                                <div
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Monthly Plan */}
                    <Card className="relative">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">{SUBSCRIPTION_TIERS.monthly.displayName}</CardTitle>
                            <CardDescription>
                                <div className="text-xl font-bold">
                                    {formatPrice(SUBSCRIPTION_TIERS.monthly.firstMonthPrice!)}
                                    <span className="text-sm font-normal"> first month</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Then {formatPrice(SUBSCRIPTION_TIERS.monthly.price)} / month
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ul className="space-y-1 text-sm">
                                {SUBSCRIPTION_TIERS.monthly.features.slice(0, 4).map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <svg className="h-3 w-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleUpgrade('monthly')}
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
                            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                Best Value
                            </div>
                        </div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">{SUBSCRIPTION_TIERS.lifetime.displayName}</CardTitle>
                            <CardDescription>
                                <div className="text-xl font-bold">
                                    {formatPrice(SUBSCRIPTION_TIERS.lifetime.price)}
                                    <span className="text-sm font-normal"> one-time</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Lifetime access
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ul className="space-y-1 text-sm">
                                {SUBSCRIPTION_TIERS.lifetime.features.slice(0, 4).map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <svg className="h-3 w-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={() => handleUpgrade('lifetime')}
                                loading={isUpgrading === 'lifetime'}
                                disabled={!!isUpgrading}
                            >
                                Get Lifetime Access
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            <ModalFooter>
                <Button variant="outline" onClick={onClose}>
                    Maybe Later
                </Button>
                <Link href="/subscription">
                    <Button variant="ghost">
                        View All Plans
                    </Button>
                </Link>
            </ModalFooter>
        </Modal>
    );
};

// Inline upgrade prompt for when limits are reached
interface InlineUpgradePromptProps {
    title?: string;
    message?: string;
    currentCount?: number;
    limit?: number;
    feature?: string;
}

const InlineUpgradePrompt: React.FC<InlineUpgradePromptProps> = ({
    title = "Upgrade to continue",
    message = "You've reached the limit for your current plan.",
    currentCount,
    limit,
    feature = "charts",
}) => {
    return (
        <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">{title}</h3>
                        <p className="mt-1 text-sm text-yellow-700">{message}</p>

                        {currentCount !== undefined && limit !== undefined && (
                            <div className="mt-3">
                                <div className="text-xs text-yellow-700 mb-1">
                                    {currentCount} / {limit} {feature} used
                                </div>
                                <div className="w-full bg-yellow-200 rounded-full h-2">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <Link href="/subscription">
                                <Button size="sm" className="mr-3">
                                    Upgrade Now
                                </Button>
                            </Link>
                            <Link href="/subscription">
                                <Button variant="outline" size="sm">
                                    View Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export { UpgradePrompt, InlineUpgradePrompt };