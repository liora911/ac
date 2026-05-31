import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export const runtime = "nodejs";

const DEEPGRAM_MODEL = process.env.DEEPGRAM_MODEL || "nova-3";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = getClientIP(req);
    const rl = rateLimiters.deepgramToken(ip);
    if (!rl.success) {
      return NextResponse.json(
        {
          error: "Too many Deepgram token requests. Please wait.",
          retryAfter: Math.ceil(rl.resetIn / 1000),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) },
        }
      );
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Deepgram temporary tokens: short-lived (default ~30s), scoped to
    // streaming usage. Browser can pass this as the Sec-WebSocket-Protocol
    // value when opening the listen socket.
    const grantRes = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!grantRes.ok) {
      const errBody = await grantRes.text();
      console.error("Deepgram token grant error:", grantRes.status, errBody);
      return NextResponse.json(
        {
          error: `Deepgram ${grantRes.status}: failed to mint token.`,
          detail: errBody.slice(0, 400),
        },
        { status: 502 }
      );
    }

    const data = (await grantRes.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      return NextResponse.json(
        { error: "Deepgram grant response missing access_token." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: data.access_token,
      expiresIn: data.expires_in,
      model: DEEPGRAM_MODEL,
    });
  } catch (error) {
    console.error("Deepgram token route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to mint Deepgram token",
      },
      { status: 500 }
    );
  }
}
