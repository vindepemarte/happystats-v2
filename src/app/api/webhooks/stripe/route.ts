// Stripe webhook handler

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '../../../../lib/stripe';
import { getUserByEmail, updateUser } from '../../../../lib/models/user';
import { createSubscription, updateSubscriptionByStripeId } from '../../../../lib/models/subscription';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }



    // Verify webhook signature
    let event;
    try {
      event = stripe!.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    const { customer, metadata, mode } = session;
    const userId = metadata?.userId;
    const tier = metadata?.tier;

    if (!userId || !tier) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Update user subscription tier
    await updateUser(userId, {
      subscriptionTier: tier as any,
      subscriptionStatus: 'active',
    });

    // For one-time payments (lifetime), create a subscription record
    if (mode === 'payment') {
      await createSubscription({
        userId,
        status: 'active',
      });
    }

    console.log(`Checkout completed for user ${userId}, tier: ${tier}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const { customer, id: subscriptionId, current_period_start, current_period_end, status } = subscription;
    
    // Get customer email to find user
    const stripeCustomer = await stripe!.customers.retrieve(customer);
    if (!stripeCustomer || stripeCustomer.deleted) {
      console.error('Customer not found:', customer);
      return;
    }

    const user = await getUserByEmail((stripeCustomer as any).email);
    if (!user) {
      console.error('User not found for customer:', customer);
      return;
    }

    // Create subscription record
    await createSubscription({
      userId: user.id,
      stripeSubscriptionId: subscriptionId,
      status: status,
      currentPeriodStart: new Date(current_period_start * 1000),
      currentPeriodEnd: new Date(current_period_end * 1000),
    });

    // Update user subscription tier
    await updateUser(user.id, {
      subscriptionTier: 'monthly',
      subscriptionStatus: status,
    });

    console.log(`Subscription created for user ${user.id}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const { id: subscriptionId, current_period_start, current_period_end, status, cancel_at_period_end } = subscription;
    
    // Update subscription record
    await updateSubscriptionByStripeId(subscriptionId, {
      status: status,
      currentPeriodStart: new Date(current_period_start * 1000),
      currentPeriodEnd: new Date(current_period_end * 1000),
    });

    // Get subscription to find user
    const subscriptionRecord = await import('../../../../lib/models/subscription').then(m => 
      m.getSubscriptionByStripeId(subscriptionId)
    );
    
    if (subscriptionRecord) {
      // Update user status
      await updateUser(subscriptionRecord.userId, {
        subscriptionStatus: cancel_at_period_end ? 'canceled' : status,
      });
    }

    console.log(`Subscription updated: ${subscriptionId}, status: ${status}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const { id: subscriptionId } = subscription;
    
    // Update subscription record
    await updateSubscriptionByStripeId(subscriptionId, {
      status: 'canceled',
    });

    // Get subscription to find user
    const subscriptionRecord = await import('../../../../lib/models/subscription').then(m => 
      m.getSubscriptionByStripeId(subscriptionId)
    );
    
    if (subscriptionRecord) {
      // Downgrade user to free tier
      await updateUser(subscriptionRecord.userId, {
        subscriptionTier: 'free',
        subscriptionStatus: 'canceled',
      });
    }

    console.log(`Subscription deleted: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const { subscription: subscriptionId } = invoice;
    
    if (subscriptionId) {
      // Update subscription status to active
      await updateSubscriptionByStripeId(subscriptionId, {
        status: 'active',
      });

      // Get subscription to find user
      const subscriptionRecord = await import('../../../../lib/models/subscription').then(m => 
        m.getSubscriptionByStripeId(subscriptionId)
      );
      
      if (subscriptionRecord) {
        await updateUser(subscriptionRecord.userId, {
          subscriptionStatus: 'active',
        });
      }
    }

    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const { subscription: subscriptionId } = invoice;
    
    if (subscriptionId) {
      // Update subscription status to past_due
      await updateSubscriptionByStripeId(subscriptionId, {
        status: 'past_due',
      });

      // Get subscription to find user
      const subscriptionRecord = await import('../../../../lib/models/subscription').then(m => 
        m.getSubscriptionByStripeId(subscriptionId)
      );
      
      if (subscriptionRecord) {
        await updateUser(subscriptionRecord.userId, {
          subscriptionStatus: 'past_due',
        });
      }
    }

    console.log(`Payment failed for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}