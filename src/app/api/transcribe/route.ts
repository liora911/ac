import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
const POLISH_MODEL = process.env.OPENAI_POLISH_MODEL || "gpt-4o-mini";

const POLISH_SYSTEM_PROMPT = `You are an editor cleaning up raw speech-to-text transcripts for an academic author.

Rules:
- Preserve the author's exact wording, meaning, and tone. Do not paraphrase or add content.
- Add proper punctuation (commas, periods, question marks) and capitalization.
- Break the text into logical paragraphs where natural pauses suggest new thoughts.
- Remove pure fillers only: "um", "uh", "אה", "אהמ", "אממ", "like" (when used as filler), repeated words from stutters.
- Keep terminology, names, and phrasing exactly as spoken. Never "improve" academic content.
- If the transcript is in Hebrew, output Hebrew. If English, output English. If mixed, preserve the mix.
- Output only the cleaned transcript. No preamble, no explanation, no quotes around it.`;

async function polishTranscript(text: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: POLISH_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: POLISH_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Polish failed: ${res.status} ${errBody}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() || text;
}

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
          error: "Too many transcription requests. Please wait.",
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

    const formData = await req.formData();
    const audio = formData.get("audio");
    const language = (formData.get("language") as string | null) || "";
    const polish = formData.get("polish") === "true";
    const prompt = (formData.get("prompt") as string | null) || "";

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }
    if (audio.size === 0) {
      return NextResponse.json(
        { error: "Empty audio file." },
        { status: 400 }
      );
    }
    if (audio.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Audio exceeds ${MAX_FILE_BYTES / 1024 / 1024}MB limit.` },
        { status: 413 }
      );
    }

    const filename =
      audio instanceof File && audio.name ? audio.name : "audio.webm";

    const openaiForm = new FormData();
    openaiForm.append("file", audio, filename);
    openaiForm.append("model", TRANSCRIBE_MODEL);
    openaiForm.append("response_format", "json");
    if (language && language !== "auto") {
      openaiForm.append("language", language);
    }
    if (prompt) {
      openaiForm.append("prompt", prompt);
    }

    const openaiRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: openaiForm,
      }
    );

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("OpenAI transcription error:", openaiRes.status, errBody);
      return NextResponse.json(
        { error: "Transcription failed. Please try again." },
        { status: 502 }
      );
    }

    const data = (await openaiRes.json()) as { text?: string };
    const rawText = (data.text || "").trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "No speech detected in the audio." },
        { status: 422 }
      );
    }

    let text = rawText;
    let polished = false;
    if (polish) {
      try {
        text = await polishTranscript(rawText, apiKey);
        polished = true;
      } catch (err) {
        console.error("Polish pass failed, returning raw:", err);
      }
    }

    return NextResponse.json({
      text,
      raw: rawText,
      polished,
      model: TRANSCRIBE_MODEL,
    });
  } catch (error) {
    console.error("Transcribe route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 }
    );
  }
}
