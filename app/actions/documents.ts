"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getPortalSession } from "@/lib/portal";

export type UploadState = { error?: string; uploaded?: string };

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

/** Keep the original name readable but make it safe as a storage key. */
function safeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function uploadDocument(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  if (!isSupabaseConfigured()) {
    return { error: "Uploads are not switched on yet." };
  }

  const session = await getPortalSession();
  if (!session) return { error: "Please sign in again." };
  if (!session.clientId) {
    return { error: "Your account is not linked to a client record yet. Message us and we will fix it." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file first." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "That file is over 20 MB. Send it on WhatsApp instead and we will add it." };
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return { error: "We accept PDFs, images, Word, Excel and CSV files." };
  }

  const projectId = String(formData.get("projectId") ?? "") || null;

  // Path convention the storage policy checks: first segment is the client id.
  const folder = projectId ?? "general";
  const storagePath = `${session.clientId}/${folder}/${Date.now()}-${safeName(file.name)}`;

  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documents").insert({
    client_id: session.clientId,
    project_id: projectId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: session.userId,
  });

  if (insertError) {
    // Do not leave an orphan in storage if the index row failed.
    await supabase.storage.from("client-documents").remove([storagePath]);
    return { error: insertError.message };
  }

  revalidatePath("/portal/documents");
  if (projectId) revalidatePath(`/portal/projects/${projectId}`);
  return { uploaded: file.name };
}
