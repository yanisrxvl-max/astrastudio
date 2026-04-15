import { Resend } from "resend";

const FROM = "Astra Studio <bonjour@studioastraparis.fr>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "bonjour@studioastraparis.fr";

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set, skipping email.");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}

export async function sendToAdmin(
  subject: string,
  html: string
): Promise<boolean> {
  return sendEmail({ to: ADMIN_EMAIL, subject, html });
}

export { ADMIN_EMAIL };
