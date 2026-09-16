import { z } from "zod";

/**
 * Fail loudly at boot rather than silently at 2am when a sequence tries to send.
 * Only validates what the running surface actually needs.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  AUTOMATION_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues
        .map((i) => i.path.join("."))
        .join(", ")}`,
    );
  }
  cached = parsed.data;
  return cached;
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}
