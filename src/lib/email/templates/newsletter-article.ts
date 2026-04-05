import type { NewsletterArticleEmailProps } from "@/types/Email/email";

export function generateNewsletterArticleEmail({
  articleTitle,
  articleSubtitle,
  articleUrl,
  customMessage,
  unsubscribeUrl,
  locale = "he",
}: NewsletterArticleEmailProps): string {
  const isHebrew = locale === "he";
  const direction = isHebrew ? "rtl" : "ltr";

  const texts = {
    he: {
      readArticle: "קרא את המאמר",
      unsubscribe: "להסרה מרשימת התפוצה",
      siteFooter: "אבשלום אליצור",
    },
    en: {
      readArticle: "Read Article",
      unsubscribe: "Unsubscribe from newsletter",
      siteFooter: "Avshalom Elitzur",
    },
  };

  const t = texts[locale];

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${articleTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; direction: ${direction};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                ${t.siteFooter}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <!-- Custom Message -->
              <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${customMessage}
              </p>

              <!-- Article Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                <h2 style="color: #1f2937; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  ${articleTitle}
                </h2>
                ${articleSubtitle ? `
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  ${articleSubtitle}
                </p>
                ` : ""}
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${articleUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                  ${t.readArticle}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                ${t.siteFooter}
              </p>
              <a href="${unsubscribeUrl}" style="color: #9ca3af; font-size: 11px; text-decoration: underline;">
                ${t.unsubscribe}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
