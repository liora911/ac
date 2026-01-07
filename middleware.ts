import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected admin routes
const PROTECTED_ROUTES = ["/elitzur"];

// Allowed admin emails
const ALLOWED_EMAILS = [
  "avshalom@iyar.org.il",
  "yarinmster@gmail.com",
  "yakir@iyar.org.il",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, redirect to admin login page
  if (!token) {
    const loginUrl = new URL("/auth/admin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user email is in allowed list
  const userEmail = token.email?.toLowerCase();
  if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
    // Redirect to unauthorized page
    return NextResponse.redirect(new URL("/auth/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match /elitzur exactly and all sub-paths
    "/elitzur",
    "/elitzur/:path*",
  ],
};
