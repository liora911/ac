/**
 * Email sending and template types
 */

/**
 * Options for sending emails via Resend
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Props for payment confirmation email template
 */
export interface PaymentConfirmationEmailProps {
  holderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  numberOfSeats: number;
  ticketUrl: string;
  amountPaid: string;
  locale?: "he" | "en";
}

/**
 * Props for ticket confirmation email template
 */
export interface TicketConfirmationEmailProps {
  holderName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  numberOfSeats: number;
  ticketUrl: string;
  locale?: "he" | "en";
}

/**
 * Props for newsletter article email template
 */
export interface NewsletterArticleEmailProps {
  articleTitle: string;
  articleSubtitle?: string;
  articleUrl: string;
  customMessage: string;
  unsubscribeUrl: string;
  locale?: "he" | "en";
}
