import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Portal data access.
 *
 * Nothing here filters by client id. Every query relies on Row Level Security
 * to do that, which is deliberate: if a filter is ever forgotten in the UI, the
 * database still refuses. The policies were tested against Postgres 16 with two
 * separate client users before any of this was written.
 */

export type ProjectStatus = "requested" | "in_progress" | "review" | "delivered";
export type InvoiceStatus = "draft" | "sent" | "partly_paid" | "paid" | "void";

export type Project = {
  id: string;
  name: string;
  summary: string | null;
  status: ProjectStatus;
  price_kes: number | null;
  started_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  project_id: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  number: string;
  amount_kes: number;
  paid_kes: number;
  status: InvoiceStatus;
  description: string | null;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
};

export type Activity = {
  id: string;
  type: string;
  description: string;
  created_at: string;
};

export type PortalSession = {
  userId: string;
  email: string | null;
  fullName: string | null;
  clientId: string | null;
  clientName: string | null;
  role: string;
};

/** null when Supabase is not configured or nobody is signed in. */
export async function getPortalSession(): Promise<PortalSession | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, client_id, clients(name)")
    .eq("id", user.id)
    .single();

  const client = profile?.clients as { name: string } | { name: string }[] | null;
  const clientName = Array.isArray(client) ? (client[0]?.name ?? null) : (client?.name ?? null);

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    clientId: profile?.client_id ?? null,
    clientName,
    role: profile?.role ?? "client",
  };
}

export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, summary, status, price_kes, started_at, delivered_at, created_at")
    .order("created_at", { ascending: false });
  return (data as Project[]) ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, summary, status, price_kes, started_at, delivered_at, created_at")
    .eq("id", id)
    .maybeSingle();
  return (data as Project) ?? null;
}

export async function getDocuments(projectId?: string): Promise<DocumentRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let q = supabase
    .from("documents")
    .select("id, file_name, storage_path, mime_type, size_bytes, project_id, created_at")
    .order("created_at", { ascending: false });
  if (projectId) q = q.eq("project_id", projectId);
  const { data } = await q;
  return (data as DocumentRow[]) ?? [];
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, number, amount_kes, paid_kes, status, description, due_date, issued_at, paid_at")
    .order("issued_at", { ascending: false, nullsFirst: false });
  return (data as Invoice[]) ?? [];
}

export async function getActivity(limit = 8): Promise<Activity[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("id, type, description, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Activity[]) ?? [];
}

/** Short-lived download link. Never expose storage paths directly. */
export async function signedDocumentUrl(storagePath: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(storagePath, 60 * 5);
  return data?.signedUrl ?? null;
}

// ---------- presentation helpers ----------

export const PROJECT_STAGES: { key: ProjectStatus; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "delivered", label: "Delivered" },
];

export function stageIndex(status: ProjectStatus): number {
  return PROJECT_STAGES.findIndex((s) => s.key === status);
}

export function kes(amount: number | null): string {
  if (amount === null) return "—";
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

export function fileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function shortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Awaiting payment",
  partly_paid: "Part paid",
  paid: "Paid",
  void: "Void",
};
