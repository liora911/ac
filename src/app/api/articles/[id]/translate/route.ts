import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, authErrorResponse } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

export const maxDuration = 120;

// POST - Translate an article to another language
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { id } = await params;
    const { targetLanguage } = await request.json();

    if (!targetLanguage || !["he", "en"].includes(targetLanguage)) {
      return NextResponse.json(
        { error: "targetLanguage must be 'he' or 'en'" },
        { status: 400 }
      );
    }

    // Fetch the original article
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        authors: { orderBy: { order: "asc" } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if translation already exists
    const existing = await prisma.article.findFirst({
      where: { translatedFromId: id, language: targetLanguage },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Translation already exists", translationId: existing.id },
        { status: 409 }
      );
    }

    const sourceLang = targetLanguage === "en" ? "Hebrew" : "English";
    const targetLang = targetLanguage === "en" ? "English" : "Hebrew";

    // Translate title and subtitle first (fast, small)
    let translatedTitle: string;
    let translatedSubtitle: string | null = null;

    try {
      const titleResult = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: `Translate the following title from ${sourceLang} to ${targetLang}. Return ONLY the translated text, nothing else.\n\n${article.title}`,
      });
      translatedTitle = titleResult.text.trim();
    } catch (e) {
      console.error("Title translation failed:", e);
      return NextResponse.json({ error: "Failed to translate title" }, { status: 500 });
    }

    if (article.subtitle) {
      try {
        const subtitleResult = await generateText({
          model: google("gemini-2.0-flash"),
          prompt: `Translate the following subtitle from ${sourceLang} to ${targetLang}. Return ONLY the translated text, nothing else.\n\n${article.subtitle}`,
        });
        translatedSubtitle = subtitleResult.text.trim();
      } catch (e) {
        console.error("Subtitle translation failed:", e);
        translatedSubtitle = article.subtitle;
      }
    }

    // Translate content (can be large)
    let translatedContent: string;
    try {
      const contentResult = await generateText({
        model: google("gemini-2.0-flash"),
        prompt: `Translate this HTML from ${sourceLang} to ${targetLang}. Preserve ALL HTML tags exactly. Only translate the text between tags. Return ONLY the translated HTML, nothing else.\n\n${article.content}`,
      });
      translatedContent = contentResult.text.trim();
    } catch (e) {
      console.error("Content translation failed:", e);
      return NextResponse.json({ error: "Failed to translate content" }, { status: 500 });
    }

    const translated = {
      title: translatedTitle,
      subtitle: translatedSubtitle,
      content: translatedContent,
    };

    // Generate a unique slug for the translation
    const baseSlug = generateSlug(translated.title);
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.article.findUnique({ where: { slug: s } });
      return !!existing;
    });

    // Calculate read duration
    const wordCount = translated.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
    const readDuration = Math.max(1, Math.ceil(wordCount / 200));

    // Create the translated article as a draft
    const translatedArticle = await prisma.article.create({
      data: {
        title: translated.title,
        subtitle: translated.subtitle,
        slug,
        content: translated.content,
        articleImage: article.articleImage,
        publisherName: article.publisherName,
        publisherImage: article.publisherImage,
        readDuration,
        published: false,
        isPremium: article.isPremium,
        isFeatured: false,
        direction: targetLanguage === "he" ? "rtl" : "ltr",
        titleDirection: targetLanguage === "he" ? "rtl" : "ltr",
        language: targetLanguage,
        translatedFromId: id,
        authorId: article.authorId,
        categoryId: article.categoryId,
        // Copy categories
        categories: article.categories.length > 0
          ? {
              create: article.categories.map((c) => ({
                categoryId: c.categoryId,
              })),
            }
          : undefined,
        // Copy tags
        tags: article.tags.length > 0
          ? {
              create: article.tags.map((t) => ({
                tagId: t.tagId,
              })),
            }
          : undefined,
        // Copy authors
        authors: article.authors.length > 0
          ? {
              create: article.authors.map((a) => ({
                name: a.name,
                imageUrl: a.imageUrl,
                order: a.order,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      translationId: translatedArticle.id,
      slug: translatedArticle.slug,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate article" },
      { status: 500 }
    );
  }
}
