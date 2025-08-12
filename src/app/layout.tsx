import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "../components/providers/SessionProvider";
import PWAProvider from "../components/providers/PWAProvider";
import { ErrorProvider } from "../components/providers/ErrorProvider";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { getServerSession } from "../lib/auth";
import { OfflineIndicator } from "../components/ui/OfflineIndicator";

// Initialize application in production (but not during build)
if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
  import('../lib/startup');
}

export const metadata: Metadata = {
  title: "HappyStats - Personal Data Tracking",
  description: "Track, visualize, and analyze your personal data through interactive charts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HappyStats",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "HappyStats",
    title: "HappyStats - Personal Data Tracking",
    description: "Track, visualize, and analyze your personal data through interactive charts",
  },
  twitter: {
    card: "summary",
    title: "HappyStats - Personal Data Tracking",
    description: "Track, visualize, and analyze your personal data through interactive charts",
  },
};

export const viewport: Viewport = {
  themeColor: "#8821f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <ErrorBoundary level="page">
          <ErrorProvider>
            <PWAProvider>
              <SessionProvider session={session}>
                {children}
                <OfflineIndicator />
              </SessionProvider>
            </PWAProvider>
          </ErrorProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
