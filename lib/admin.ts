import "server-only";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * CRM data access.
 *
 * Deliberately uses the ordinary server client, not the service-role key.
 * The `is_admin()` policies already grant full read/write to admin and staff,
 * so an accidental leak of this module to a non-admin session still fails
 * closed at the database. The service-role key is reserved for the automation
 * runner and webhooks, which have no user session to check.
 */

export type LeadStatus = "new" | "contacted" | "proposal" | "won" | "lost";

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  source: string;
  page_context: string | null;
  status: LeadStatus;
  message: string | null;
  notes: string | null;
  converted_client_id: string | null;
  last_contacted_at: string | null;
  created_at: string;
};

export type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  notes: string | null;
  archived: boolean;
  created_at: string;
};

export type AdminProject = {
  id: string;
  client_id: string;
  name: string;
  summary: string | null;
  status: "requested" | "in_progress" | "review" | "delivered";
  price_kes: number | null;
  created_at: string;
};

export type AdminInvoice = {
  id: string;
  client_id: string;
  number: string;
  amount_kes: number;
  paid_kes: number;
  status: "draft" | "sent" | "partly_paid" | "paid" | "void";
  description: string | null;
  due_date: string | null;
  issued_at: string | null;
  paid_at: string | null;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount_kes: number;
  phone: string | null;
  status: "pending" | "success" | "failed" | "cancelled";
  mpesa_receipt: string | null;
  failure_reason: string | null;
  created_at: string;
};

export const LEAD_STAGES: { key: LeadStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin" || data?.role === "staff";
}

/**
 * Leads still sitting at new or contacted after a week.
 *
 * Computed here rather than in the page because React forbids impure calls
 * like Date.now() during render — and the lint rule is right: a value that
 * changes every render is a value the UI cannot reason about.
 */
export function staleLeads(leads: Lead[], days = 7): Lead[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return leads.filter(
    (l) =>
      (l.status === "new" || l.status === "contacted") &&
      new Date(l.created_at).getTime() < cutoff,
  );
}

export async function getLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as Lead[]) ?? [];
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  return (data as Lead) ?? null;
}

export async function getClients(): Promise<ClientRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as ClientRow[]) ?? [];
}

export async function getClient(id: string): Promise<ClientRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return (data as ClientRow) ?? null;
}

export type PortalUser = {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

/** Who can log into the portal for this client. */
export async function getClientPortalUsers(clientId: string): Promise<PortalUser[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("client_id", clientId);
  return (data as PortalUser[]) ?? [];
}

export async function getClientProjects(clientId: string): Promise<AdminProject[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data as AdminProject[]) ?? [];
}

export async function getClientInvoices(clientId: string): Promise<AdminInvoice[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", clientId)
    .order("issued_at", { ascending: false, nullsFirst: false });
  return (data as AdminInvoice[]) ?? [];
}

export async function getAllInvoices(): Promise<(AdminInvoice & { clients: { name: string } | null })[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .order("issued_at", { ascending: false, nullsFirst: false });
  return (data as (AdminInvoice & { clients: { name: string } | null })[]) ?? [];
}

export async function getInvoice(id: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name, whatsapp_phone, phone)")
    .eq("id", id)
    .maybeSingle();
  return data as
    | (AdminInvoice & { clients: { name: string; whatsapp_phone: string | null; phone: string | null } | null })
    | null;
}

export async function getInvoicePayments(invoiceId: string): Promise<Payment[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false });
  return (data as Payment[]) ?? [];
}

export async function getClientActivity(clientId: string, limit = 20) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("id, type, description, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as { id: string; type: string; description: string; created_at: string }[]) ?? [];
}

/** Numbers for the dashboard. One round trip each, all cheap counts. */
export async function getCrmSummary() {
  if (!isSupabaseConfigured()) {
    return { openLeads: 0, clients: 0, activeProjects: 0, outstandingKes: 0 };
  }
  const supabase = await createClient();

  const [leads, clients, projects, invoices] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "proposal"]),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("archived", false),
    supabase.from("projects").select("id", { count: "exact", head: true }).in("status", ["requested", "in_progress", "review"]),
    supabase.from("invoices").select("amount_kes, paid_kes").in("status", ["sent", "partly_paid"]),
  ]);

  const outstandingKes =
    (invoices.data as { amount_kes: number; paid_kes: number }[] | null)?.reduce(
      (sum, i) => sum + (Number(i.amount_kes) - Number(i.paid_kes)),
      0,
    ) ?? 0;

  return {
    openLeads: leads.count ?? 0,
    clients: clients.count ?? 0,
    activeProjects: projects.count ?? 0,
    outstandingKes,
  };
}
