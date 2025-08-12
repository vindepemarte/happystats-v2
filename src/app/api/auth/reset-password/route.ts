// Password reset API endpoint

import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser, hashPassword } from "../../../../lib/models/user";
import { z } from "zod";
import crypto from "crypto";

// In-memory store for reset tokens (in production, use Redis or database)
const resetTokens = new Map<string, { email: string; expires: Date }>();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const confirmResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
});

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "request") {
      return await handleResetRequest(body);
    } else if (action === "confirm") {
      return await handleResetConfirm(body);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'request' or 'confirm'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleResetRequest(body: any) {
  // Validate input
  const validationResult = requestResetSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: "Validation failed", 
        details: validationResult.error.issues 
      },
      { status: 400 }
    );
  }

  const { email } = validationResult.data;

  // Check if user exists
  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not for security
    return NextResponse.json(
      { message: "If the email exists, a reset link has been sent" },
      { status: 200 }
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store token (in production, store in database with expiration)
  resetTokens.set(resetToken, { email, expires });

  // In production, send email with reset link
  console.log(`Password reset token for ${email}: ${resetToken}`);
  console.log(`Reset link: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`);

  return NextResponse.json(
    { 
      message: "If the email exists, a reset link has been sent",
      // In development, return token for testing
      ...(process.env.NODE_ENV === 'development' && { token: resetToken })
    },
    { status: 200 }
  );
}

async function handleResetConfirm(body: any) {
  // Validate input
  const validationResult = confirmResetSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: "Validation failed", 
        details: validationResult.error.issues 
      },
      { status: 400 }
    );
  }

  const { token, password } = validationResult.data;

  // Check if token exists and is valid
  const tokenData = resetTokens.get(token);
  if (!tokenData) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  if (new Date() > tokenData.expires) {
    resetTokens.delete(token);
    return NextResponse.json(
      { error: "Reset token has expired" },
      { status: 400 }
    );
  }

  // Get user
  const user = await getUserByEmail(tokenData.email);
  if (!user) {
    resetTokens.delete(token);
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update user password
  await updateUser(user.id, { 
    passwordHash 
  });

  // Remove used token
  resetTokens.delete(token);

  return NextResponse.json(
    { message: "Password reset successfully" },
    { status: 200 }
  );
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expires) {
      resetTokens.delete(token);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes