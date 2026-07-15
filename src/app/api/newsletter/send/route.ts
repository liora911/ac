import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, authErrorResponse } from "@/lib/auth/apiAuth";
import prisma from "@/lib/prisma/prisma";
import { sendEmail } from "@/lib/email/resend";
import { generateNewsletterArticleEmail } from "@/lib/email/templates/newsletter-article";

// POST - Send newsletter to all subscribers (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isAuthError(auth)) {
      return authErrorResponse(auth);
    }

    const { articleId, subject, customMessage } = await request.json();

    if (!articleId || !subject || !customMessage) {
      return NextResponse.json(
        { error: "articleId, subject, and customMessage are required" },
        { status: 400 }
      );
    }

    // Fetch the article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { title: true, subtitle: true, slug: true },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Fetch all subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      select: { email: true, unsubscribeToken: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ error: "No subscribers" }, { status: 400 });
    }

    // NEXTAUTH_URL (the canonical domain) wins; VERCEL_URL is only a fallback.
    // Without the parentheses this always resolved to the vercel.app host.
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const articleUrl = `${baseUrl}/articles/${article.slug}`;

    // Replace variables in the custom message
    const processMessage = (message: string) => {
      return message
        .replace(/\{articleName\}/g, article.title)
        .replace(/\{articleSubtitle\}/g, article.subtitle || "")
        .replace(/\{articleTitle\}/g, article.title);
    };

    const processedMessage = processMessage(customMessage);
    const processedSubject = processMessage(subject);

    // Send emails individually (each gets unique unsubscribe link)
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`;

      const html = generateNewsletterArticleEmail({
        articleTitle: article.title,
        articleSubtitle: article.subtitle || undefined,
        articleUrl,
        customMessage: processedMessage,
        unsubscribeUrl,
        locale: "he",
      });

      const result = await sendEmail({
        to: subscriber.email,
        subject: processedSubject,
        html,
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        console.error(`Failed to send newsletter to ${subscriber.email}:`, result.error);
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: subscribers.length });
  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
