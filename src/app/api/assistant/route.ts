import { google } from "@ai-sdk/google";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { APP_NAVIGATION_MAP } from "@/constants/AppNavigationMap";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";
import prisma from "@/lib/prisma/prisma";

export const maxDuration = 30;

// Content moderation - block inappropriate content
const BLOCKED_PATTERNS = [
  /\b(kill|murder|attack|bomb|shoot|stab|hurt|harm|die|death|blood|gore)\b/i,
  /\b(sex|porn|nude|naked|xxx|erotic|fetish|nsfw)\b/i,
  /\b(hate|racist|nazi|terror|extrem)\b/i,
  /\b(cocaine|heroin|meth|drugs|weed|marijuana)\b/i,
];

const isInappropriateContent = (text: string): boolean => {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
};

// ── Tools ───────────────────────────────────────────────────────────

const visitorTools = {
  searchArticles: tool({
    description:
      "Search for articles on the website. Returns titles, authors, categories, and links.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query (optional)"),
      limit: z.number().optional().default(5).describe("Max results"),
    }),
    execute: async ({ query, limit }: { query?: string; limit: number }) => {
      const articles = await prisma.article.findMany({
        where: {
          published: true,
          ...(query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" as const } },
                  { content: { contains: query, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          title: true,
          slug: true,
          readDuration: true,
          createdAt: true,
          authors: { select: { name: true }, orderBy: { order: "asc" } },
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return articles.map((a) => ({
        title: a.title,
        authors: a.authors.map((au) => au.name).join(", "),
        category: a.category?.name ?? "Uncategorized",
        readDuration: a.readDuration,
        link: `/articles/${a.slug || a.id}`,
        date: a.createdAt.toISOString().split("T")[0],
      }));
    },
  }),

  searchLectures: tool({
    description:
      "Search for video lectures. Returns titles, categories, and links.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query (optional)"),
      limit: z.number().optional().default(5).describe("Max results"),
    }),
    execute: async ({ query, limit }: { query?: string; limit: number }) => {
      const lectures = await prisma.lecture.findMany({
        where: query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {},
        select: {
          id: true,
          title: true,
          duration: true,
          createdAt: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return lectures.map((l) => ({
        title: l.title,
        category: l.category.name,
        duration: l.duration,
        link: `/lectures/${l.id}`,
        date: l.createdAt.toISOString().split("T")[0],
      }));
    },
  }),

  searchPresentations: tool({
    description:
      "Search for presentations. Returns titles, categories, and links.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query (optional)"),
      limit: z.number().optional().default(5).describe("Max results"),
    }),
    execute: async ({ query, limit }: { query?: string; limit: number }) => {
      const presentations = await prisma.presentation.findMany({
        where: {
          published: true,
          ...(query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" as const } },
                  { description: { contains: query, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return presentations.map((p) => ({
        title: p.title,
        category: p.category.name,
        link: `/presentations/${p.id}`,
        date: p.createdAt.toISOString().split("T")[0],
      }));
    },
  }),

  searchEvents: tool({
    description:
      "Search for events (upcoming and past). Returns titles, dates, locations, and links.",
    inputSchema: z.object({
      query: z.string().optional().describe("Search query (optional)"),
      upcoming: z.boolean().optional().default(true).describe("Only upcoming events"),
      limit: z.number().optional().default(5).describe("Max results"),
    }),
    execute: async ({ query, upcoming, limit }: { query?: string; upcoming: boolean; limit: number }) => {
      const events = await prisma.event.findMany({
        where: {
          published: true,
          ...(upcoming ? { eventDate: { gte: new Date() } } : {}),
          ...(query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" as const } },
                  { description: { contains: query, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          title: true,
          eventDate: true,
          location: true,
          eventType: true,
          maxSeats: true,
          _count: { select: { tickets: true } },
        },
        orderBy: { eventDate: upcoming ? "asc" : "desc" },
        take: limit,
      });
      return events.map((e) => ({
        title: e.title,
        date: e.eventDate.toISOString().split("T")[0],
        location: e.location,
        type: e.eventType,
        seatsAvailable:
          e.maxSeats != null ? e.maxSeats - e._count.tickets : null,
        link: `/events/${e.id}`,
      }));
    },
  }),

  getArticleContent: tool({
    description:
      "Get the full content of a specific article by slug or title. Use when a user asks about a specific article.",
    inputSchema: z.object({
      slug: z.string().describe("The article slug or partial title"),
    }),
    execute: async ({ slug }: { slug: string }) => {
      const article = await prisma.article.findFirst({
        where: {
          published: true,
          OR: [
            { slug },
            { title: { contains: slug, mode: "insensitive" as const } },
          ],
        },
        select: {
          title: true,
          slug: true,
          content: true,
          readDuration: true,
          createdAt: true,
          authors: { select: { name: true }, orderBy: { order: "asc" } },
          category: { select: { name: true } },
        },
      });
      if (!article) return { error: "Article not found" };
      const plainText = article.content
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000);
      return {
        title: article.title,
        authors: article.authors.map((a) => a.name).join(", "),
        category: article.category?.name ?? "Uncategorized",
        readDuration: article.readDuration,
        date: article.createdAt.toISOString().split("T")[0],
        link: `/articles/${article.slug}`,
        content: plainText,
      };
    },
  }),
};

const adminTools = {
  ...visitorTools,

  getSiteStats: tool({
    description: "Get statistics about the website content and users.",
    inputSchema: z.object({}),
    execute: async () => {
      const [articles, lectures, presentations, events, users, messages] =
        await Promise.all([
          prisma.article.count({ where: { published: true } }),
          prisma.lecture.count(),
          prisma.presentation.count({ where: { published: true } }),
          prisma.event.count({ where: { published: true } }),
          prisma.user.count(),
          prisma.message.count(),
        ]);
      return {
        publishedArticles: articles,
        totalLectures: lectures,
        publishedPresentations: presentations,
        publishedEvents: events,
        registeredUsers: users,
        totalMessages: messages,
      };
    },
  }),

  listRecentMessages: tool({
    description: "List recent contact messages from visitors.",
    inputSchema: z.object({
      limit: z.number().optional().default(5).describe("Max results"),
    }),
    execute: async ({ limit }: { limit: number }) => {
      const msgs = await prisma.message.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          name: true,
          email: true,
          subject: true,
          createdAt: true,
        },
      });
      return msgs.map((m) => ({
        from: `${m.name} (${m.email})`,
        subject: m.subject,
        date: m.createdAt.toISOString().split("T")[0],
      }));
    },
  }),

  listDrafts: tool({
    description: "List draft (unpublished) content across all content types.",
    inputSchema: z.object({}),
    execute: async () => {
      const [articles, presentations, events] = await Promise.all([
        prisma.article.findMany({
          where: { published: false },
          select: { id: true, title: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.presentation.findMany({
          where: { published: false },
          select: { id: true, title: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.event.findMany({
          where: { published: false },
          select: { id: true, title: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);
      return {
        articles: articles.map((a) => ({ title: a.title, link: `/articles/${a.id}/edit` })),
        presentations: presentations.map((p) => ({ title: p.title, link: `/edit-presentation/${p.id}` })),
        events: events.map((e) => ({ title: e.title, link: `/edit-event/${e.id}` })),
      };
    },
  }),
};

// ── System prompts ──────────────────────────────────────────────────

const getSystemPrompt = (isAdmin: boolean) => {
  if (isAdmin) {
    return `You are a professional academic assistant for Professor Avshalom C. Elitzur's website administration panel. Address the professor with the respect and formality befitting a distinguished academic.

## Your Capabilities
You have tools to SEARCH and RETRIEVE actual content from the website database. When asked about content, USE YOUR TOOLS — don't guess.

You can:
- **Search articles, lectures, presentations, events** by keyword
- **Read article content** — get the full text of an article
- **Get site statistics** — article count, user count, unread messages
- **List unread messages** — check visitor correspondence
- **List drafts** — show unpublished content

IMPORTANT: When asked "how many articles do we have?" or "show me recent lectures" — USE THE TOOLS. Never make up numbers or titles.

## Admin Panel Navigation (at /elitzur)
1. **משתמש פעיל** - Dashboard  2. **דף הבית** - Homepage  3. **קטגוריות** - Categories
4. **מאמרים** - Articles  5. **אירועים** - Events  6. **הרצאות** - Lectures
7. **מצגות** - Presentations  8. **הודעות** - Messages  9. **הגדרות מערכת** - Settings

## Navigation Reference:
${JSON.stringify(APP_NAVIGATION_MAP, null, 2)}

## Guidelines:
1. Address the professor respectfully and professionally.
2. Match the language of inquiry — Hebrew to Hebrew, English to English.
3. When providing content links, format them as clickable paths (e.g., /articles/my-article).
4. Be concise yet thorough.
5. Scope: Assist exclusively with website administration.`;
  }

  return `You are a friendly assistant for visitors of Professor Avshalom C. Elitzur's academic website.

## Your Capabilities
You have tools to SEARCH and RETRIEVE actual content from the website. When visitors ask about content, USE YOUR TOOLS — don't guess.

You can:
- **Search articles** — find articles by topic
- **Search lectures** — find video lectures
- **Search presentations** — find slide presentations
- **Search events** — find upcoming/past events
- **Read article content** — get full text to answer questions about it

IMPORTANT: When asked "what articles are about quantum mechanics?" — USE searchArticles. When asked about a specific article — USE getArticleContent. Never make up titles or content.

## About the Professor
Professor Avshalom C. Elitzur is a physicist and philosopher known for work in quantum mechanics, including the Elitzur-Vaidman bomb tester thought experiment.

## Website Sections
- **Articles** (/articles) — Publications and papers
- **Lectures** (/lectures) — Video lectures
- **Presentations** (/presentations) — Slide presentations
- **Events** (/events) — Academic events with ticket reservations
- **Contact** (/contact) — Message the professor
- **Search** (/search) — Search all content

## Guidelines:
1. Be friendly and welcoming.
2. Respond in the same language as the question (Hebrew/English).
3. Format content links as clickable paths (e.g., /articles/my-article).
4. USE YOUR TOOLS to answer content questions — never make up article titles or lecture names.
5. Keep responses concise but helpful.
6. Only discuss website-related topics.`;
};

// ── Route handler ───────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rateLimitResult = rateLimiters.assistant(ip);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment before trying again.",
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
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

    const { messages, isAdmin } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("GOOGLE_GENERATIVE_AI_API_KEY is not set", {
        status: 500,
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && isInappropriateContent(lastMessage.content)) {
      return new Response(
        "I can only help with questions about this website. Please ask me about lectures, articles, events, or how to navigate the site.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: getSystemPrompt(!!isAdmin),
      messages,
      tools: isAdmin ? adminTools : visitorTools,
      stopWhen: stepCountIs(3),
    });

    // Extract text — check steps if main text is empty (can happen with tool calling)
    let responseText = result.text;
    if (!responseText) {
      for (const step of result.steps) {
        if (step.text) responseText = step.text;
      }
    }

    if (!responseText) {
      console.warn("Assistant: empty text after tool calling", {
        steps: result.steps.length,
        toolCalls: result.steps.map((s) => s.toolCalls?.length ?? 0),
      });
      responseText =
        "I processed your request but couldn't generate a response. Please try rephrasing your question.";
    }

    return new Response(responseText, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return new Response(
      error instanceof Error ? error.message : "Unknown error",
      { status: 500 }
    );
  }
}
