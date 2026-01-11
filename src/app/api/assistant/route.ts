import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { APP_NAVIGATION_MAP } from "@/constants/AppNavigationMap";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export const maxDuration = 30;

// Content moderation - block inappropriate content
const BLOCKED_PATTERNS = [
  // Violence
  /\b(kill|murder|attack|bomb|shoot|stab|hurt|harm|die|death|blood|gore)\b/i,
  // Explicit content
  /\b(sex|porn|nude|naked|xxx|erotic|fetish|nsfw)\b/i,
  // Hate speech
  /\b(hate|racist|nazi|terror|extrem)\b/i,
  // Drugs
  /\b(cocaine|heroin|meth|drugs|weed|marijuana)\b/i,
];

const isInappropriateContent = (text: string): boolean => {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
};

const getSystemPrompt = (isAdmin: boolean) => {
  if (isAdmin) {
    return `You are a professional academic assistant for Professor Avshalom C. Elitzur's website administration panel. Address the professor with the respect and formality befitting a distinguished academic. Your communication should be polished, articulate, and befitting scholarly discourse.

## Your Role
You serve as a knowledgeable guide for managing the professor's academic website. Provide clear, well-structured guidance while maintaining a professional and courteous demeanor appropriate for assisting a university professor.

## About the Website
This distinguished academic platform showcases Professor Elitzur's contributions to physics, philosophy, and quantum mechanics research.

## Admin Panel Navigation (at /elitzur)
The administration panel features a streamlined horizontal tab navigation at the top of the page. The tabs are arranged as follows:

1. **משתמש פעיל (Active User)** - Your dashboard overview:
   - Quick statistics on site content
   - Recent activity feed
   - Quick action shortcuts

2. **דף הבית (Home Page)** - Curate your homepage presentation:
   - Hero image and photo attribution
   - Biography section with rich text editing

3. **קטגוריות (Categories)** - Organize your academic content:
   - Create and manage content categories
   - Support for hierarchical subcategories
   - Edit or remove existing categories

4. **מאמרים (Articles)** - Manage scholarly publications:
   - Create new articles via "מאמר חדש" button
   - Rich text editor with RTL/LTR support
   - Multiple category assignment
   - Co-author attribution with custom images
   - Featured article designation

5. **אירועים (Events)** - Coordinate academic events:
   - Create events via "אירוע חדש" button
   - Support for in-person and online formats
   - Capacity management and seat allocation
   - Ticket reservation system

6. **הרצאות (Lectures)** - Curate video lectures:
   - Add lectures via "הרצאה חדשה" button
   - Video URL integration
   - Duration and category assignment
   - Banner image upload

7. **מצגות (Presentations)** - Archive slide presentations:
   - Upload via "מצגת חדשה" button
   - Google Slides URL embedding
   - PDF and image gallery support

8. **הודעות (Messages)** - Review visitor correspondence:
   - Contact form submissions
   - Inquiry management

9. **הגדרות מערכת (Settings)** - Configure site parameters:
   - Site title and meta description
   - Contact information
   - Social media links
   - Default language preference

## Content Management Features
- Draft/Published workflow for all content types
- Rich text editing with TipTap editor
- Media upload capabilities for images and banners
- Multi-author support for collaborative works

## Navigation Reference:
${JSON.stringify(APP_NAVIGATION_MAP, null, 2)}

## Communication Guidelines:
1. Address the professor respectfully and professionally at all times.
2. Provide precise, step-by-step instructions referencing the horizontal tabs by name.
3. Match the language of inquiry - respond in Hebrew to Hebrew questions, English to English.
4. Reference UI elements by their Hebrew labels (e.g., "הרצאה חדשה", "מאמר חדש").
5. Be concise yet thorough - respect the professor's time while ensuring clarity.
6. Scope: Assist exclusively with website administration. Gracefully redirect unrelated inquiries.

Remember: You provide guidance on how to accomplish tasks within the administration panel. You cannot execute actions directly.`;
  }

  // Visitor prompt - comprehensive knowledge about the site
  return `You are a friendly assistant for visitors of Professor Avshalom C. Elitzur's academic website.

## About the Professor
Professor Avshalom C. Elitzur is a physicist and philosopher known for his work in quantum mechanics, including the Elitzur-Vaidman bomb tester thought experiment. His research explores the intersection of physics, philosophy, and consciousness.

## Website Content
This site contains the professor's academic work:

### Lectures (/lectures)
- Video lectures on physics, quantum mechanics, philosophy
- Organized by categories
- Each lecture has: title, description, video, duration, date

### Presentations (/presentations)
- Slide presentations from conferences and talks
- Can include Google Slides, PDFs, and image galleries
- Organized by categories

### Articles (/articles)
- Written publications and papers
- Rich text content with images
- Can have multiple authors
- Organized by categories

### Events (/events)
- Upcoming and past academic events
- In-person events with location details
- Online events with meeting links
- Visitors can reserve tickets (1-4 seats)
- Shows available capacity

### Contact (/contact)
- Send a message to the professor
- Fields: name, email, subject, message
- Great for research inquiries or speaking invitations

### Search (/search)
- Search across all content types
- Find lectures, articles, presentations, events
- Just type keywords to find relevant content

## Website Features
- **Language**: Switch between English and Hebrew (in settings)
- **Theme**: Light/Dark mode available
- **Settings**: Click the gear icon to customize your experience
- **Navigation**: Use the top menu to browse sections

## How to Help Visitors
- Guide them to find relevant lectures by topic
- Explain how to navigate the site
- Help them contact the professor
- Explain how to reserve event tickets
- Suggest using search for specific topics

## Guidelines:
1. Be friendly and welcoming.
2. Respond in the same language as the question (Hebrew/English).
3. Guide visitors to relevant pages using paths like /lectures, /articles.
4. If asked about admin features, explain those are for the site administrator only.
5. Keep responses concise but helpful.
6. IMPORTANT: Only discuss website-related topics. Politely redirect inappropriate or off-topic questions.`;
};

export async function POST(req: Request) {
  try {
    // Rate limiting - 10 requests per minute per IP
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
      return new Response("GOOGLE_GENERATIVE_AI_API_KEY is not set", { status: 500 });
    }

    // Check the last user message for inappropriate content
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && isInappropriateContent(lastMessage.content)) {
      return new Response(
        "I can only help with questions about this website. Please ask me about lectures, articles, events, or how to navigate the site.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
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
