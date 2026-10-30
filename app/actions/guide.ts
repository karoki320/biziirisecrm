"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const KNOWN = new Set(["welcome", "practice", "tip-agreement", "tip-invoice", "tip-document"]);

/**
 * Mark a tour as seen for the signed-in user. Written with the service key
 * because clients can't write their own profile row — but only ever to the
 * caller's own id, and only the guide_seen column.
 */
export async function markGuideSeen(tour: string): Promise<void> {
  if (!isSupabaseConfigured() || !KNOWN.has(tour)) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const admin = createAdminClient();
    const { data } = await admin.from("profiles").select("guide_seen").eq("id", user.id).maybeSingle();
    const seen = new Set<string>((data?.guide_seen as string[] | null) ?? []);
    if (seen.has(tour)) return;
    seen.add(tour);
    await admin.from("profiles").update({ guide_seen: [...seen] }).eq("id", user.id);
  } catch {
    // Not fatal: the browser also remembers, so the tour won't nag.
  }
}

/** Which tours this user has seen. Empty if the column isn't there yet. */
export async function getGuideSeen(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("profiles").select("guide_seen").eq("id", user.id).maybeSingle();
  if (error) return [];
  return (data?.guide_seen as string[] | null) ?? [];
}
