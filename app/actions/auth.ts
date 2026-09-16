"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type AuthState = { error?: string; sent?: boolean };

const emailSchema = z.string().trim().toLowerCase().email("That does not look like an email address.");

/**
 * Magic link is the primary route in. SME clients lose passwords, and a link
 * lands in the inbox we already email their invoices to.
 */
export async function signInWithMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "The client portal is not connected yet. Message us on WhatsApp and we will send your update directly." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const next = String(formData.get("next") ?? "/portal");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      // We never create accounts from the login form. Clients are added by us.
      shouldCreateUser: false,
      emailRedirectTo: `${site.url}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };
  return { sent: true };
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "The client portal is not connected yet. Message us on WhatsApp and we will send your update directly." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const password = String(formData.get("password") ?? "");
  if (password.length < 1) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data,
    password,
  });

  // Deliberately vague: never reveal whether an email exists.
  if (error) return { error: "That email and password do not match." };

  revalidatePath("/portal", "layout");
  redirect(String(formData.get("next") ?? "/portal"));
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
