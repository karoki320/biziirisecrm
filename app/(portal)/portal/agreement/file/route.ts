import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Opens the custom agreement PDF a client has been asked to sign.
 * Looked up through RLS, so a client can only ever reach their own; the
 * storage path never reaches the browser.
 */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) redirect("/portal");

  const id = new URL(request.url).searchParams.get("id") ?? "";
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("signature_requests")
    .select("custom_path")
    .eq("id", id)
    .maybeSingle();

  if (!req?.custom_path) redirect("/portal");

  // Streamed from our own domain (not a redirect to storage) so the page can
  // show it inline in a frame, and the storage URL never reaches the browser.
  const { data: file } = await supabase.storage.from("client-documents").download(req.custom_path);
  if (!file) redirect("/portal");

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="agreement.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
