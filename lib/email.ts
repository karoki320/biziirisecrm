import "server-only";
import { Resend } from "resend";
import { requireEnv } from "./env";

let client: Resend | null = null;

function resend() {
  if (!client) client = new Resend(requireEnv("RESEND_API_KEY"));
  return client;
}

export type SendEmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Surfaces in the Resend dashboard and in our own send_log. */
  tags?: { name: string; value: string }[];
  /** `content` is base64. Resend caps a whole message at 40MB. */
  attachments?: { filename: string; content: string }[];
};

export async function sendEmail(payload: SendEmailPayload) {
  const { data, error } = await resend().emails.send({
    from: requireEnv("RESEND_FROM_EMAIL"),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    replyTo: payload.replyTo || process.env.RESEND_REPLY_TO || undefined,
    tags: payload.tags,
    attachments: payload.attachments,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, providerMessageId: data?.id ?? "" };
}
