import { toE164Kenya } from "@/lib/whatsapp";

/**
 * Phone-number logins without SMS.
 *
 * Supabase signs people in by email or by phone, and phone sign-in needs a
 * paid SMS provider. So a phone-invited client gets a login email that is
 * made from their number — 254712345678@phone.biziirise.com — confirmed at
 * creation, so nothing is ever sent to it. They never see it; they type
 * their phone number and we turn it into this address.
 */
export const PHONE_LOGIN_DOMAIN = "phone.biziirise.com";

export function phoneLoginEmail(phone: string): string | null {
  const e164 = toE164Kenya(phone);
  return e164 ? `${e164}@${PHONE_LOGIN_DOMAIN}` : null;
}

export function isPhoneLoginEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${PHONE_LOGIN_DOMAIN}`));
}

/** 254712345678 → 0712 345 678, for showing back to people. */
export function prettyKenyanPhone(e164: string): string {
  const local = e164.startsWith("254") ? `0${e164.slice(3)}` : e164;
  return local.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}
