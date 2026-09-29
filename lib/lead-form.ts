/**
 * Choices shown on the /get-started form.
 *
 * In their own file on purpose: a "use server" module may only export async
 * functions, so these constants cannot live beside the action that validates
 * against them. Both the form and the server action import them from here, so
 * the chips a person taps and the values the server accepts can never drift.
 */

export const BUSINESS_TYPES = [
  "Shop",
  "Minimart/Supermarket",
  "Pharmacy",
  "Boutique",
  "Hardware",
  "Restaurant/Café",
  "Salon/Barber",
  "Other",
] as const;

export const BRANCHES = ["1", "2–3", "4+"] as const;
