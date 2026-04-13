import prisma from "@/lib/prisma/prisma";
import { sendEmail } from "@/lib/email/resend";
import { generateNewsletterArticleEmail } from "@/lib/email/templates/newsletter-article";

function replaceVariables(template: string, article: { title: string; subtitle: string | null }) {
  return template
    .replace(/\{articleName\}/g, article.title)
    .replace(/\{articleTitle\}/g, article.title)
    .replace(/\{articleSubtitle\}/g, article.subtitle || "");
}

/**
 * Auto-send newsletter to all subscribers when an article is published.
 * Runs in the background (non-blocking) — does not throw.
 */
export async function sendNewsletterForArticle(articleId: string) {
  try {
    const [article, settings] = await Promise.all([
      prisma.article.findUnique({
        where: { id: articleId },
        select: { title: true, subtitle: true, slug: true, language: true },
      }),
      prisma.siteSettings.findFirst(),
    ]);

    if (!article || !article.slug) return;

    const subscribers = await prisma.newsletterSubscriber.findMany({
      select: { email: true, unsubscribeToken: true },
    });

    if (subscribers.length === 0) return;

    const baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

    const articleUrl = `${baseUrl}/articles/${article.slug}`;
    const isHebrew = article.language === "he" || !article.language;

    const subjectTemplate = isHebrew
      ? (settings?.newsletterSubject || "מאמר חדש: {articleName}")
      : (settings?.newsletterSubjectEn || "New Article: {articleName}");

    const messageTemplate = isHebrew
      ? (settings?.newsletterMessage || "מאמר חדש פורסם: {articleName}. מוזמנים לקרוא!")
      : (settings?.newsletterMessageEn || "A new article has been published: {articleName}. Check it out!");

    const subject = replaceVariables(subjectTemplate, article);
    const customMessage = replaceVariables(messageTemplate, article);

    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`;

      const html = generateNewsletterArticleEmail({
        articleTitle: article.title,
        articleSubtitle: article.subtitle || undefined,
        articleUrl,
        customMessage,
        unsubscribeUrl,
        locale: isHebrew ? "he" : "en",
      });

      await sendEmail({ to: subscriber.email, subject, html });
    }

    console.log(`Newsletter sent to ${subscribers.length} subscribers for article: ${article.title}`);
  } catch (error) {
    console.error("Auto newsletter send failed:", error);
  }
}
