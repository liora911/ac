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

    // GA Realtime API: mint a browser ephemeral key via /v1/realtime/client_secrets.
    // The session is fully configured here; the browser just opens the WSS and streams audio.
    const sessionRes = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "transcription",
            audio: {
              input: {
                format: { type: "audio/pcm", rate: 24000 },
                transcription: {
                  model: REALTIME_MODEL,
                  ...(language ? { language } : {}),
                  ...(prompt ? { prompt } : {}),
                },
                // Tuned for low-latency live preview: snap on speech faster
                // (lower threshold), commit utterances on shorter pauses.
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.3,
                  prefix_padding_ms: 100,
                  silence_duration_ms: 200,
                },
              },
            },
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
      value?: string;
      expires_at?: number;
      session?: { id?: string };
    };

    if (!data.value) {
      return NextResponse.json(
        { error: "Realtime client secret response missing value." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: data.value,
      expiresAt: data.expires_at,
      sessionId: data.session?.id,
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
