import { authOptions } from "@/lib/auth/auth";
import NextAuth from "next-auth";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

// Wrap POST handler with rate limiting for login attempts
async function rateLimitedPOST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const ip = getClientIP(request);
  const rateLimitResult = rateLimiters.auth(ip);

  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({
        error: "Too many login attempts. Please wait before trying again.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rateLimitResult.resetIn / 1000)),
        },
      }
    );
  }

  return handler(request, context);
}

export { handler as GET, rateLimitedPOST as POST };
