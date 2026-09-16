import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Safaricom Daraja STK callback.
 *
 * Three things this has to get right, all learned the hard way by people who
 * did not:
 *
 *  1. **Always answer 200.** Safaricom retries anything else, and a retry storm
 *     against a handler that is already failing makes the problem worse. We
 *     accept, record, and deal with our own errors on our side.
 *  2. **Be idempotent.** Retries are normal, so a callback that lands twice must
 *     not credit an invoice twice. We only act on a payment still `pending`.
 *  3. **Keep the raw payload.** The first time there is a dispute, the field you
 *     did not store is the one you need.
 *
 * This runs with the service-role key because there is no user session — a
 * request from Safaricom is not signed in as anybody.
 */

export const dynamic = "force-dynamic";

type CallbackItem = { Name: string; Value?: string | number };

function pick(items: CallbackItem[], name: string) {
  return items.find((i) => i.Name === name)?.Value;
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const callback = (body as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  const checkoutRequestId = callback?.CheckoutRequestID as string | undefined;
  const resultCode = Number(callback?.ResultCode ?? -1);
  const resultDesc = String(callback?.ResultDesc ?? "");

  if (!checkoutRequestId) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  try {
    const supabase = createAdminClient();

    const { data: payment } = await supabase
      .from("payments")
      .select("id, invoice_id, status, amount_kes")
      .eq("checkout_request_id", checkoutRequestId)
      .maybeSingle();

    // Unknown or already-settled payment: record nothing, but still accept.
    if (!payment || payment.status !== "pending") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (resultCode !== 0) {
      // 1032 is the customer cancelling. Worth distinguishing from a failure.
      await supabase
        .from("payments")
        .update({
          status: resultCode === 1032 ? "cancelled" : "failed",
          failure_reason: resultDesc,
          raw_callback: body,
        })
        .eq("id", payment.id);

      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const items = (callback?.CallbackMetadata as { Item?: CallbackItem[] })?.Item ?? [];
    const receipt = String(pick(items, "MpesaReceiptNumber") ?? "");
    const paidAmount = Number(pick(items, "Amount") ?? payment.amount_kes);

    await supabase
      .from("payments")
      .update({
        status: "success",
        mpesa_receipt: receipt || null,
        amount_kes: paidAmount,
        raw_callback: body,
      })
      .eq("id", payment.id);

    // Reconcile the invoice from the sum of successful payments rather than by
    // incrementing — that way a replay or a manual correction cannot drift.
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, amount_kes")
      .eq("id", payment.invoice_id)
      .maybeSingle();

    if (invoice) {
      const { data: settled } = await supabase
        .from("payments")
        .select("amount_kes")
        .eq("invoice_id", invoice.id)
        .eq("status", "success");

      const paid = (settled ?? []).reduce((s, p) => s + Number(p.amount_kes), 0);
      const fullyPaid = paid >= Number(invoice.amount_kes);

      await supabase
        .from("invoices")
        .update({
          paid_kes: paid,
          status: fullyPaid ? "paid" : "partly_paid",
          paid_at: fullyPaid ? new Date().toISOString() : null,
        })
        .eq("id", invoice.id);
    }
  } catch {
    // Swallow deliberately: our failure is not Safaricom's problem to retry.
    // The payment stays pending and shows as such in the CRM.
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}

/** Daraja only POSTs. A GET here is a human or a scanner. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
