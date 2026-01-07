import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin routes - require ADMIN role (checked at page level)
const ADMIN_ROUTES = ["/elitzur"];

// User routes - require any authenticated user
const USER_ROUTES = ["/account", "/my-tickets"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check route type
  const isAdminRoute = ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isUserRoute = USER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isAdminRoute && !isUserRoute) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // No session - redirect to appropriate login page
  if (!sessionToken) {
    if (isAdminRoute) {
      const loginUrl = new URL("/auth/admin-login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // User routes redirect to public login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists - role check happens at page level
  // (Edge Runtime can't query database for role)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes
    "/elitzur",
    "/elitzur/:path*",
    // User routes
    "/account",
    "/account/:path*",
    "/my-tickets",
    "/my-tickets/:path*",
  ],
};
