import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import prisma from "@/lib/prisma/prisma";
import type { AuthResult, AuthError } from "@/types/Auth/api-auth";

export type { AuthResult, AuthError };

/**
 * Require authentication for an API route.
 * Returns the session if authenticated, or an error response.
 *
 * @example
 * export async function POST(request: Request) {
 *   const auth = await requireAuth();
 *   if ("error" in auth) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   const { session } = auth;
 *   // ... use session
 * }
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true, image: true },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  return { session, user };
}

/**
 * Require admin authorization for an API route.
 * Returns the session and user if authorized, or an error response.
 *
 * @example
 * export async function POST(request: Request) {
 *   const auth = await requireAdmin();
 *   if ("error" in auth) {
 *     return NextResponse.json({ error: auth.error }, { status: auth.status });
 *   }
 *   const { session, user } = auth;
 *   // ... use session and user
 * }
 */
export async function requireAdmin(): Promise<AuthResult | AuthError> {
  const auth = await requireAuth();

  if ("error" in auth) {
    return auth;
  }

  const isAdmin = auth.user.email && ALLOWED_EMAILS.includes(auth.user.email.toLowerCase());

  if (!isAdmin) {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return auth;
}

/**
 * Check if authentication result is an error
 */
export function isAuthError(
  result: AuthResult | AuthError
): result is AuthError {
  return "error" in result;
}

/**
 * Create an error response from an auth error
 */
export function authErrorResponse(error: AuthError): NextResponse {
  return NextResponse.json({ error: error.error }, { status: error.status });
}

/**
 * Helper to check if a user email is an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

/**
 * Get the current session without requiring auth
 * Returns null if not authenticated
 */
export async function getOptionalSession() {
  return getServerSession(authOptions);
}
