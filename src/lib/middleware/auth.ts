// Authentication middleware for protected routes

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    // Get the token from the request
    const token = await getToken({ 
      req: request, 
      secret: process.env.JWT_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Add user info to the request for the handler
    const user = {
      id: token.id,
      email: token.email,
      subscriptionTier: token.subscriptionTier,
      subscriptionStatus: token.subscriptionStatus,
    };

    return await handler(request, user);
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

// Helper function to check subscription limits
export function checkSubscriptionLimit(
  user: any, 
  action: 'create_chart' | 'add_data_point'
): boolean {
  switch (action) {
    case 'create_chart':
      // Free tier users are limited to 3 charts
      if (user.subscriptionTier === 'free') {
        // This check should be done in the actual handler with database query
        return true; // We'll implement the actual check in the chart creation endpoint
      }
      return true;
    
    case 'add_data_point':
      // All users can add data points (for now)
      return true;
    
    default:
      return false;
  }
}

// Helper function to get user from token
export async function getUserFromToken(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.JWT_SECRET 
    });

    if (!token) {
      return null;
    }

    return {
      id: token.id as string,
      email: token.email as string,
      subscriptionTier: token.subscriptionTier as string,
      subscriptionStatus: token.subscriptionStatus as string,
    };
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}

// Middleware for API routes that require authentication
export function requireAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Add user to request context
    (request as any).user = user;
    
    return handler(request);
  };
}

// Middleware for API routes that require specific subscription tiers
export function requireSubscription(
  allowedTiers: string[], 
  handler: Function
) {
  return async (request: NextRequest) => {
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!allowedTiers.includes(user.subscriptionTier)) {
      return NextResponse.json(
        { 
          error: "Subscription upgrade required",
          requiredTiers: allowedTiers,
          currentTier: user.subscriptionTier
        },
        { status: 403 }
      );
    }

    // Add user to request context
    (request as any).user = user;
    
    return handler(request);
  };
}