import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * WhatsApp Cloud API webhook.
 *
 * This is the thing that closes the attribution gap: the homepage CTA sends
 * people into WhatsApp with no form, which is right for conversion and means
 * no lead record exists. Once Meta approves the number, every inbound message
 * lands here and becomes a row in `leads` — including the page context we
 * smuggled into the pre-filled text.
 *
 * Safe to deploy before approval. Without credentials it answers politely and
 * does nothing.
 */

export const dynamic = "force-dynamic";

/** Meta calls GET once when you save the webhook, and expects the challenge back. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected) {
    return new NextResponse("WHATSAPP_VERIFY_TOKEN is not set", { status: 503 });
  }

  if (mode === "subscribe" && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * Meta signs every POST with your app secret. An unsigned or wrongly signed
 * request is not from Meta, and we refuse it — otherwise anyone who finds this
 * URL can write rows into the CRM.
 */
function signatureValid(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice("sha256=".length);

  // Constant-time compare; lengths must match or timingSafeEqual throws.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(given, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** "…about a project (Homepage hero)" -> "Homepage hero" */
function extractPageContext(text: string): string | null {
  const match = text.match(/\(([^)]{2,60})\)\s*$/);
  return match ? match[1].trim() : null;
}

type WaMessage = { from?: string; type?: string; text?: { body?: string }; timestamp?: string };
type WaContact = { wa_id?: string; profile?: { name?: string } };

export async function POST(request: NextRequest) {
  const raw = await request.text();

  if (!signatureValid(raw, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const admin = createAdminClient();

    const entries = (body.entry ?? []) as {
      changes?: { value?: { messages?: WaMessage[]; contacts?: WaContact[] } }[];
    }[];

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages ?? [];
        const contacts = change.value?.contacts ?? [];

        for (const message of messages) {
          const from = message.from;
          if (!from) continue;

          const text = message.type === "text" ? (message.text?.body ?? "") : `[${message.type}]`;
          const contact = contacts.find((c) => c.wa_id === from);
          const name = contact?.profile?.name?.trim() || `WhatsApp ${from.slice(-4)}`;

          // Already a client? Log it against them instead of making a lead.
          const { data: client } = await admin
            .from("clients")
            .select("id")
            .eq("whatsapp_phone", from)
            .maybeSingle();

          if (client) {
            await admin.from("activity_log").insert({
              client_id: client.id,
              type: "whatsapp.received",
              description: text.slice(0, 500),
              metadata: { from },
            });
            continue;
          }

          // Existing lead? Touch it rather than creating a duplicate.
          const { data: lead } = await admin
            .from("leads")
            .select("id")
            .eq("whatsapp_phone", from)
            .maybeSingle();

          if (lead) {
            await admin
              .from("leads")
              .update({ last_contacted_at: new Date().toISOString() })
              .eq("id", lead.id);
            continue;
          }

          await admin.from("leads").insert({
            name,
            phone: `+${from}`,
            whatsapp_phone: from,
            source: "whatsapp",
            page_context: extractPageContext(text),
            message: text.slice(0, 2000),
            status: "new",
          });
        }
      }
    }
  } catch {
    // Never make Meta retry over our own failure.
  }

  return NextResponse.json({ ok: true });
}
