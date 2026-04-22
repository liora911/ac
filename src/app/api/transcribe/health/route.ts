import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";

export const runtime = "nodejs";

const TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
const POLISH_MODEL = process.env.OPENAI_POLISH_MODEL || "gpt-4o-mini";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: "OPENAI_API_KEY is not set on the server.",
      transcribeModel: TRANSCRIBE_MODEL,
      polishModel: POLISH_MODEL,
    });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 401) {
      return NextResponse.json({
        ok: false,
        configured: true,
        reachable: true,
        message:
          "OpenAI rejected the key (401). Double-check it's copied correctly and not revoked.",
        keyPreview: `${apiKey.slice(0, 7)}…${apiKey.slice(-4)}`,
      });
    }

    if (res.status === 429) {
      const body = await res.text();
      return NextResponse.json({
        ok: false,
        configured: true,
        reachable: true,
        message:
          "Rate-limited or quota exceeded. Most commonly: no billing credits added yet. Add credits at https://platform.openai.com/settings/organization/billing",
        detail: body.slice(0, 400),
      });
    }

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({
        ok: false,
        configured: true,
        reachable: true,
        status: res.status,
        message: `OpenAI responded with ${res.status}.`,
        detail: body.slice(0, 400),
      });
    }

    const data = (await res.json()) as {
      data?: Array<{ id: string }>;
    };
    const available = data.data?.map((m) => m.id) ?? [];
    const hasTranscribe = available.includes(TRANSCRIBE_MODEL);
    const hasPolish = available.includes(POLISH_MODEL);

    return NextResponse.json({
      ok: hasTranscribe && hasPolish,
      configured: true,
      reachable: true,
      keyPreview: `${apiKey.slice(0, 7)}…${apiKey.slice(-4)}`,
      transcribeModel: TRANSCRIBE_MODEL,
      polishModel: POLISH_MODEL,
      transcribeAvailable: hasTranscribe,
      polishAvailable: hasPolish,
      modelCount: available.length,
      message:
        hasTranscribe && hasPolish
          ? "All systems go — the API key is valid and both models are accessible."
          : `Key works but missing model access. Transcribe: ${hasTranscribe ? "OK" : "MISSING"}, Polish: ${hasPolish ? "OK" : "MISSING"}. Check project model permissions at https://platform.openai.com/settings/organization/projects`,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      configured: true,
      reachable: false,
      message:
        "Could not reach OpenAI. Check server network / firewall.",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
