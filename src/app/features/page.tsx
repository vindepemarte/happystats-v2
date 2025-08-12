import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features - HappyStats',
  description: 'Discover all the powerful features of HappyStats for mobile-first data visualization and analysis.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Powerful Features
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need for mobile-first data visualization and analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Chart Creation */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Interactive Charts
            </h3>
            <p className="text-muted-foreground">
              Create beautiful, interactive charts optimized for mobile viewing with support for multiple chart types.
            </p>
          </div>

          {/* Mobile Optimization */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Mobile-First Design
            </h3>
            <p className="text-muted-foreground">
              Designed specifically for mobile devices with touch-friendly interfaces and responsive layouts.
            </p>
          </div>

          {/* Real-time Updates */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Real-time Updates
            </h3>
            <p className="text-muted-foreground">
              Your charts update in real-time as you add new data points, keeping your visualizations current.
            </p>
          </div>

          {/* Data Management */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Smart Data Management
            </h3>
            <p className="text-muted-foreground">
              Easily add, edit, and organize your data points with intelligent categorization and filtering.
            </p>
          </div>

          {/* Offline Support */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Offline Capability
            </h3>
            <p className="text-muted-foreground">
              Work with your charts even when offline. Changes sync automatically when you're back online.
            </p>
          </div>

          {/* Export & Share */}
          <div className="p-6 bg-card rounded-lg border">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Export & Share
            </h3>
            <p className="text-muted-foreground">
              Export your charts as images or share them directly with colleagues and stakeholders.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who trust HappyStats for their data visualization needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/register"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 border border-input text-base font-medium rounded-md text-foreground bg-background hover:bg-accent transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}