import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export const runtime = "nodejs";

const REALTIME_MODEL =
  process.env.OPENAI_REALTIME_TRANSCRIBE_MODEL || "gpt-4o-transcribe";

type RealtimeBody = {
  language?: string;
  prompt?: string;
};

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
    const rl = rateLimiters.realtimeSession(ip);
    if (!rl.success) {
      return NextResponse.json(
        {
          error: "Too many realtime sessions. Please wait.",
          retryAfter: Math.ceil(rl.resetIn / 1000),
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rl.resetIn / 1000)) },
        }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as RealtimeBody;
    const language = body.language && body.language !== "auto" ? body.language : undefined;
    const prompt = body.prompt ? body.prompt.slice(0, 500) : undefined;

    const sessionRes = await fetch(
      "https://api.openai.com/v1/realtime/transcription_sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "realtime=v1",
        },
        body: JSON.stringify({
          input_audio_format: "pcm16",
          input_audio_transcription: {
            model: REALTIME_MODEL,
            ...(language ? { language } : {}),
            ...(prompt ? { prompt } : {}),
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        }),
      }
    );

    if (!sessionRes.ok) {
      const errBody = await sessionRes.text();
      console.error(
        "OpenAI realtime session error:",
        sessionRes.status,
        errBody
      );
      return NextResponse.json(
        {
          error: `OpenAI ${sessionRes.status}: failed to mint realtime session.`,
          detail: errBody.slice(0, 400),
        },
        { status: 502 }
      );
    }

    const data = (await sessionRes.json()) as {
      client_secret?: { value?: string; expires_at?: number };
      id?: string;
    };

    if (!data.client_secret?.value) {
      return NextResponse.json(
        { error: "Realtime session response missing client_secret." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: data.client_secret.value,
      expiresAt: data.client_secret.expires_at,
      sessionId: data.id,
      model: REALTIME_MODEL,
    });
  } catch (error) {
    console.error("Realtime session route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create realtime session",
      },
      { status: 500 }
    );
  }
}
