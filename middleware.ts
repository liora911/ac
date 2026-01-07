import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected admin routes
const PROTECTED_ROUTES = ["/elitzur"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for session cookie (works with both JWT and database sessions)
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // If no session token cookie, redirect to admin login page
  if (!sessionToken) {
    const loginUrl = new URL("/auth/admin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Note: For database sessions, we can't verify the email in middleware
  // The email check is handled by the signIn callback in auth.ts
  // which only allows ALLOWED_EMAILS to sign in

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match /elitzur exactly and all sub-paths
    "/elitzur",
    "/elitzur/:path*",
  ],
};
