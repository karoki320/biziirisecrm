import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Reading signature requests. Like the rest of the portal, these go through
 * RLS: a client only ever resolves their own, staff see everything.
 */

export type SignatureStatus = "pending" | "signed" | "cancelled";

export type SignatureRequest = {
  id: string;
  client_id: string;
  full_name: string | null;
  email: string | null;
  service: string | null;
  package: string | null;
  status: SignatureStatus;
  kind: "standard" | "custom";
  title: string | null;
  project_id: string | null;
  requested_at: string;
  signed_at: string | null;
  agreement_id: string | null;
};

const COLUMNS =
  "id, client_id, full_name, email, service, package, status, kind, title, project_id, requested_at, signed_at, agreement_id";

/** What to call a request on screen. */
export function requestTitle(r: Pick<SignatureRequest, "kind" | "title">): string {
  return r.title || (r.kind === "custom" ? "Agreement" : "Service agreement");
}

/** Every agreement the signed-in client still has to sign, oldest first. */
export async function getPendingSignatureRequests(): Promise<SignatureRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("signature_requests")
    .select(COLUMNS)
    .eq("status", "pending")
    .order("requested_at", { ascending: true });
  return (data as SignatureRequest[]) ?? [];
}

/** One pending request by id (RLS keeps it to the client's own). */
export async function getPendingSignatureRequest(id?: string): Promise<SignatureRequest | null> {
  const all = await getPendingSignatureRequests();
  return (id ? all.find((r) => r.id === id) : all[0]) ?? null;
}

/** Admin: every request for one client, newest first, with the signed PDF's document id. */
export async function getClientSignatureRequests(
  clientId: string,
): Promise<(SignatureRequest & { document_id: string | null })[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("signature_requests")
    .select(`${COLUMNS}, agreements(document_id)`)
    .eq("client_id", clientId)
    .order("requested_at", { ascending: false });

  return ((data ?? []) as (SignatureRequest & {
    agreements: { document_id: string | null } | { document_id: string | null }[] | null;
  })[]).map(({ agreements, ...r }) => {
    const a = Array.isArray(agreements) ? agreements[0] : agreements;
    return { ...r, document_id: a?.document_id ?? null };
  });
}
