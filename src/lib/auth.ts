// NextAuth.js configuration for HappyStats

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyUserPassword, getUserByEmail } from "./models/user";
import { User } from "../types/user";

// Ensure environment variables are loaded
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET environment variable is required");
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await verifyUserPassword(credentials.email, credentials.password);

                    if (!user) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        subscriptionTier: user.subscriptionTier,
                        subscriptionStatus: user.subscriptionStatus,
                    };
                } catch (error) {
                    console.error("Authentication error:", error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            // Persist user data in the token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.subscriptionTier = (user as any).subscriptionTier;
                token.subscriptionStatus = (user as any).subscriptionStatus;
            }
            return token;
        },
        async session({ session, token }) {
            // Send properties to the client
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                (session.user as any).subscriptionTier = token.subscriptionTier;
                (session.user as any).subscriptionStatus = token.subscriptionStatus;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Redirect to dashboard after successful login
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return `${baseUrl}/dashboard`;
        }
    },
    pages: {
        signIn: "/auth/login",
        signUp: "/auth/register",
        error: "/auth/error",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to get server-side session
export async function getServerSession() {
    const { getServerSession } = await import("next-auth");
    return await getServerSession(authOptions);
}

// Type augmentation for NextAuth
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            subscriptionTier: string;
            subscriptionStatus: string;
        };
    }

    interface User {
        id: string;
        email: string;
        subscriptionTier: string;
        subscriptionStatus: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        subscriptionTier: string;
        subscriptionStatus: string;
    }
}