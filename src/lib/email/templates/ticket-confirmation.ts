interface TicketConfirmationEmailProps {
  holderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  numberOfSeats: number;
  ticketUrl: string;
  locale?: "he" | "en";
}

export function generateTicketConfirmationEmail({
  holderName,
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  numberOfSeats,
  ticketUrl,
  locale = "he",
}: TicketConfirmationEmailProps): string {
  const isHebrew = locale === "he";
  const direction = isHebrew ? "rtl" : "ltr";

  const texts = {
    he: {
      subject: `אישור הרשמה: ${eventTitle}`,
      greeting: `שלום ${holderName},`,
      confirmation: "ההרשמה שלך אושרה בהצלחה!",
      eventDetails: "פרטי האירוע",
      date: "תאריך",
      time: "שעה",
      location: "מיקום",
      seats: "מספר מקומות",
      viewTicket: "צפה בכרטיס",
      ticketInfo: "שמור על הקישור הזה - תצטרך אותו כדי לצפות בפרטי הכרטיס שלך.",
      footer: "תודה שנרשמת!",
      siteFooter: "אבשלום אליצור",
    },
    en: {
      subject: `Registration Confirmed: ${eventTitle}`,
      greeting: `Hello ${holderName},`,
      confirmation: "Your registration has been confirmed!",
      eventDetails: "Event Details",
      date: "Date",
      time: "Time",
      location: "Location",
      seats: "Number of Seats",
      viewTicket: "View Ticket",
      ticketInfo: "Keep this link - you will need it to view your ticket details.",
      footer: "Thank you for registering!",
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
  <title>${t.subject}</title>
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
              <!-- Greeting -->
              <p style="color: #1f2937; font-size: 18px; margin: 0 0 8px 0;">
                ${t.greeting}
              </p>

              <!-- Confirmation Message -->
              <p style="color: #059669; font-size: 20px; font-weight: 600; margin: 0 0 32px 0;">
                ${t.confirmation}
              </p>

              <!-- Event Details Card -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                <h2 style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${t.eventDetails}
                </h2>

                <h3 style="color: #1f2937; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">
                  ${eventTitle}
                </h3>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">
                      ${t.date}:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">
                      ${eventDate}
                    </td>
                  </tr>
                  ${eventTime ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      ${t.time}:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">
                      ${eventTime}
                    </td>
                  </tr>
                  ` : ""}
                  ${eventLocation ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      ${t.location}:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">
                      ${eventLocation}
                    </td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                      ${t.seats}:
                    </td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">
                      ${numberOfSeats}
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${ticketUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                  ${t.viewTicket}
                </a>
              </div>

              <!-- Ticket Info -->
              <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center; background-color: #fef3c7; padding: 12px 16px; border-radius: 6px; border: 1px solid #fcd34d;">
                ${t.ticketInfo}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                ${t.footer}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ${t.siteFooter}
              </p>
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

export function getTicketConfirmationSubject(eventTitle: string, locale: "he" | "en" = "he"): string {
  return locale === "he"
    ? `אישור הרשמה: ${eventTitle}`
    : `Registration Confirmed: ${eventTitle}`;
}
