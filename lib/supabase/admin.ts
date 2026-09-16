import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. BYPASSES RLS.
 * Only for automation runners and webhook handlers that have already
 * authenticated the caller. Never import this into anything the browser reaches.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
