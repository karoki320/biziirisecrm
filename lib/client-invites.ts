import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const hashInviteToken = (token: string) => createHash("sha256").update(token).digest("hex");
const hash = hashInviteToken;

/** Looks up an open invite. Service-role only; a token is never checked in the browser. */
export async function findOpenInvite(token: string) {
  if (!isSupabaseConfigured() || !token) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("client_invites")
    .select("id, client_id, phone, full_name, expires_at, used_at, cancelled_at, clients(name, company)")
    .eq("token_hash", hash(token))
    .maybeSingle();
  if (!data || data.used_at || data.cancelled_at || new Date(data.expires_at) < new Date()) return null;
  const c = (Array.isArray(data.clients) ? data.clients[0] : data.clients) as
    | { name: string; company: string | null }
    | null;
  return {
    id: data.id as string,
    clientId: data.client_id as string,
    phone: data.phone as string,
    fullName: (data.full_name as string | null) ?? null,
    business: c?.company || c?.name || "your business",
  };
}

