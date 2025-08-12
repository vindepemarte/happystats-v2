// User-related TypeScript interfaces

export type SubscriptionTier = 'free' | 'monthly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface User {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  subscriptionTier?: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Database row interface (matches database column names)
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: Date;
  updated_at: Date;
}

// User authentication interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface UserSession {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
}