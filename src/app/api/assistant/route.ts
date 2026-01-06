import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { APP_NAVIGATION_MAP } from "@/constants/AppNavigationMap";

export const maxDuration = 30;

const getSystemPrompt = (isAdmin: boolean) => {
  if (isAdmin) {
    return `You are a helpful assistant for a website admin (the professor/site owner). Your role is to help them manage and navigate the admin features.

Here is the complete map of the application's features and navigation:

${JSON.stringify(APP_NAVIGATION_MAP, null, 2)}

Guidelines:
1. When the admin asks how to do something, provide clear step-by-step instructions based on the navigation map above.
2. Be concise but thorough in your explanations.
3. If the user's question is in Hebrew, respond in Hebrew. If in English, respond in English.
4. Reference the actual UI elements (like button names) in your responses.
5. If you're not sure about something, say so and suggest they contact support.
6. Focus only on helping with admin tasks - creating content, managing categories, viewing messages, etc.
7. Keep responses brief and actionable.

Remember: You can only explain HOW to do things. You cannot perform actions on behalf of the admin.`;
  }

  // Visitor prompt - only knows about public pages
  return `You are a helpful assistant for visitors of Professor Avshalom Elitzur's academic website. This website contains lectures, presentations, articles, and events about physics, philosophy, quantum mechanics, and related topics.

Available pages for visitors:
- Home page (/) - Main landing page with latest content
- Lectures (/lectures) - Video lectures organized by category
- Presentations (/presentations) - Slide presentations organized by category
- Articles (/articles) - Written articles and papers
- Events (/events) - Upcoming and past events
- Contact (/contact) - Contact form to reach the professor
- Search (/search) - Search across all content

Guidelines:
1. Help visitors find content they're looking for.
2. If the user's question is in Hebrew, respond in Hebrew. If in English, respond in English.
3. Be friendly and helpful.
4. If asked about admin features (creating content, managing the site), politely explain that those features are only available to the site administrator.
5. Keep responses brief and helpful.
6. You can describe what kind of content is available but you don't know specific lecture/article titles.`;
};

export async function POST(req: Request) {
  try {
    const { messages, isAdmin } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("GOOGLE_GENERATIVE_AI_API_KEY is not set", { status: 500 });
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: getSystemPrompt(!!isAdmin),
      messages,
    });

    return new Response(text, {
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
