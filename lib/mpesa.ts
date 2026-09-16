import "server-only";
import { requireEnv } from "./env";

const BASE = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
} as const;

function base() {
  const env = (process.env.MPESA_ENV ?? "sandbox") as keyof typeof BASE;
  return BASE[env] ?? BASE.sandbox;
}

let token: { value: string; expiresAt: number } | null = null;

/** Daraja tokens live ~3600s. Cache and refresh a minute early. */
async function accessToken(): Promise<string> {
  if (token && Date.now() < token.expiresAt) return token.value;

  const key = requireEnv("MPESA_CONSUMER_KEY");
  const secret = requireEnv("MPESA_CONSUMER_SECRET");
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${base()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Daraja auth failed: HTTP ${res.status}`);

  const json = await res.json();
  token = {
    value: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in ?? 3600) - 60) * 1000,
  };
  return token.value;
}

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export type StkPushPayload = {
  /** 2547XXXXXXXX */
  phone: string;
  amount: number;
  /** Shows on the client's M-Pesa statement. Keep under 13 chars. */
  accountReference: string;
  description: string;
};

/** Triggers the STK prompt on the client's handset. */
export async function stkPush(payload: StkPushPayload) {
  const shortcode = requireEnv("MPESA_SHORTCODE");
  const passkey = requireEnv("MPESA_PASSKEY");
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const res = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(payload.amount),
      PartyA: payload.phone,
      PartyB: shortcode,
      PhoneNumber: payload.phone,
      CallBackURL: requireEnv("MPESA_CALLBACK_URL"),
      AccountReference: payload.accountReference.slice(0, 12),
      TransactionDesc: payload.description.slice(0, 13),
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ResponseCode !== "0") {
    return {
      ok: false as const,
      error: json.errorMessage ?? json.ResponseDescription ?? `HTTP ${res.status}`,
    };
  }
  return {
    ok: true as const,
    checkoutRequestId: json.CheckoutRequestID as string,
    merchantRequestId: json.MerchantRequestID as string,
  };
}
