import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { APP_NAVIGATION_MAP } from "@/constants/AppNavigationMap";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a helpful assistant for a website management application. Your role is to help users navigate and use the application.

Here is the complete map of the application's features and navigation:

${JSON.stringify(APP_NAVIGATION_MAP, null, 2)}

Guidelines:
1. When a user asks how to do something, provide clear step-by-step instructions based on the navigation map above.
2. Be concise but thorough in your explanations.
3. If the user's question is in Hebrew, respond in Hebrew. If in English, respond in English.
4. Reference the actual UI elements (like button names) in your responses.
5. If you're not sure about something, say so and suggest they contact support.
6. Focus only on helping users navigate and use this specific application - don't answer general questions unrelated to the app.
7. Keep responses brief and actionable - users want quick guidance, not lengthy explanations.

Remember: You can only explain HOW to do things. You cannot perform actions on behalf of the user.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return new Response("GOOGLE_GENERATIVE_AI_API_KEY is not set", { status: 500 });
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT,
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
