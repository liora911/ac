import { Resend } from "resend";
import type { SendEmailOptions } from "@/types/Email/email";

export type { SendEmailOptions };

// Lazy-initialize Resend to avoid build-time errors when API key is not set
let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || "Avshalom Elitzur <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export default getResend;
