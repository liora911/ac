import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const SUGGEST_MODEL = process.env.OPENAI_POLISH_MODEL || "gpt-4o-mini";
const MAX_TEXT_CHARS = 12000;
const MAX_SUGGESTIONS = 8;

const SUGGEST_SYSTEM_PROMPT = `You are a careful proofreader reviewing a speech-to-text transcript for an academic author. The transcription engine sometimes mishears words, especially in Hebrew: homophones, wrong word segmentation, misheard technical terms, and grammar agreement errors.

Find ONLY passages that are likely transcription mistakes or clearly problematic phrasing. Do NOT rewrite style, do NOT paraphrase correct text, and do NOT invent content.

Return STRICT JSON with this exact shape:
{"suggestions":[{"original":"<exact substring copied verbatim from the transcript>","suggested":"<the corrected text>","reason":"<short explanation>"}]}

Rules:
- "original" MUST be an exact, character-for-character substring of the transcript (this is used for find-and-replace).
- Keep each "original" short — a phrase or single sentence, not a whole paragraph.
- "reason" must be in the same language as the transcript.
- At most ${MAX_SUGGESTIONS} suggestions, most important first.
- If the transcript looks clean, return {"suggestions":[]}.`;

type RawSuggestion = {
  original?: unknown;
  suggested?: unknown;
  reason?: unknown;
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
    const rl = rateLimiters.transcribe(ip);
    if (!rl.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please wait.",
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

    const body = (await req.json()) as { text?: string };
    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }
    if (text.length > MAX_TEXT_CHARS) {
      return NextResponse.json(
        { error: `Text exceeds ${MAX_TEXT_CHARS} characters.` },
        { status: 413 }
      );
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SUGGEST_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SUGGEST_SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Suggest error:", res.status, errBody);
      return NextResponse.json(
        { error: `Suggestion service failed (${res.status})` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content || "{}";

    let parsed: { suggestions?: RawSuggestion[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { suggestions: [] };
    }

    // Only keep suggestions whose "original" really exists in the transcript
    // and that actually change something — the client relies on find-and-replace
    const suggestions = (parsed.suggestions || [])
      .filter(
        (s): s is { original: string; suggested: string; reason?: string } =>
          typeof s.original === "string" &&
          typeof s.suggested === "string" &&
          s.original.trim().length > 0 &&
          s.original !== s.suggested &&
          text.includes(s.original)
      )
      .slice(0, MAX_SUGGESTIONS)
      .map((s) => ({
        original: s.original,
        suggested: s.suggested,
        reason: typeof s.reason === "string" ? s.reason : "",
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Suggest route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Suggestion service failed",
      },
      { status: 500 }
    );
  }
}
