import { Metadata } from 'next';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe';

export const metadata: Metadata = {
  title: 'Pricing - HappyStats',
  description: 'Choose the perfect plan for your data visualization needs. Start free or upgrade for unlimited charts.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you. Start free and upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                {SUBSCRIPTION_TIERS.free.name}
              </h3>
              <div className="text-3xl font-bold text-foreground mb-1">
                €{SUBSCRIPTION_TIERS.free.price}
              </div>
              <p className="text-sm text-muted-foreground">Forever free</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.free.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <a
              href="/auth/register"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent transition-colors"
            >
              Get Started Free
            </a>
          </div>

          {/* Monthly Tier */}
          <div className="p-6 bg-card rounded-lg border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                {SUBSCRIPTION_TIERS.monthly.name}
              </h3>
              <div className="text-3xl font-bold text-foreground mb-1">
                €{SUBSCRIPTION_TIERS.monthly.price}
              </div>
              <p className="text-sm text-muted-foreground">per month</p>
              <p className="text-xs text-primary mt-1">
                First month only €{SUBSCRIPTION_TIERS.monthly.firstMonthPrice}
              </p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.monthly.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <a
              href="/subscription"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Start Monthly Plan
            </a>
          </div>

          {/* Lifetime Tier */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                {SUBSCRIPTION_TIERS.lifetime.name}
              </h3>
              <div className="text-3xl font-bold text-foreground mb-1">
                €{SUBSCRIPTION_TIERS.lifetime.price}
              </div>
              <p className="text-sm text-muted-foreground">One-time payment</p>
              <p className="text-xs text-green-600 mt-1">Best value</p>
            </div>
            
            <ul className="space-y-3 mb-6">
              {SUBSCRIPTION_TIERS.lifetime.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            <a
              href="/subscription"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent transition-colors"
            >
              Get Lifetime Access
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-card-foreground mb-2">
                Can I change plans later?
              </h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can upgrade from free to monthly or lifetime at any time. You can also cancel your monthly subscription whenever you want.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-card-foreground mb-2">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-muted-foreground text-sm">
                Your data is always safe. If you downgrade, you'll keep access to your first 3 charts (free tier limit), but additional charts will be read-only until you upgrade again.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-card-foreground mb-2">
                Is there a refund policy?
              </h3>
              <p className="text-muted-foreground text-sm">
                We offer a 30-day money-back guarantee for both monthly and lifetime plans. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border">
              <h3 className="font-semibold text-card-foreground mb-2">
                Do you offer discounts for students or nonprofits?
              </h3>
              <p className="text-muted-foreground text-sm">
                Yes! We offer special pricing for students and nonprofit organizations. Contact us with your .edu email or nonprofit documentation for details.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to start visualizing your data?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust HappyStats for their data visualization needs.
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            Start Free Today
          </a>
        </div>
      </div>
    </div>
  );
}