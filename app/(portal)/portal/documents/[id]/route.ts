import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Download proxy. Looks the document up through RLS — so a client can only
 * ever resolve their own — then hands back a short-lived signed URL.
 * Storage paths never reach the browser.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) redirect("/portal");

  const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!doc) redirect("/portal/documents");

  const { data } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(doc.storage_path, 60 * 5);

  if (!data?.signedUrl) redirect("/portal/documents");
  redirect(data.signedUrl);
}
