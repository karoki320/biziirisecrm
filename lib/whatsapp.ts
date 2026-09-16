import "server-only";
import { requireEnv } from "./env";

const GRAPH_VERSION = "v21.0";

export type WhatsAppTemplatePayload = {
  to: string; // E.164 without '+', e.g. 254712345678
  template: string;
  languageCode?: string;
  variables?: string[];
};

export type WhatsAppTextPayload = {
  to: string;
  body: string;
};

type SendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string };

async function post(body: unknown): Promise<SendResult> {
  const phoneNumberId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...(body as object) }),
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: json?.error?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, providerMessageId: json?.messages?.[0]?.id ?? "" };
}

/**
 * Templates are required outside the 24-hour customer service window.
 * Every proactive notification (status change, invoice) must be a template.
 */
export function sendWhatsAppTemplate(payload: WhatsAppTemplatePayload) {
  return post({
    to: payload.to,
    type: "template",
    template: {
      name: payload.template,
      language: { code: payload.languageCode ?? "en" },
      components: payload.variables?.length
        ? [
            {
              type: "body",
              parameters: payload.variables.map((text) => ({ type: "text", text })),
            },
          ]
        : undefined,
    },
  });
}

/** Free-form text. Only valid inside the 24h window after the client last messaged. */
export function sendWhatsAppText(payload: WhatsAppTextPayload) {
  return post({
    to: payload.to,
    type: "text",
    text: { preview_url: false, body: payload.body },
  });
}

/** Kenyan numbers arrive as 07xx, +2547xx or 2547xx. Normalise before sending. */
export function toE164Kenya(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1")))
    return `254${digits}`;
  return null;
}
