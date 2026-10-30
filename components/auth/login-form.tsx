"use client";

import { useActionState, useState } from "react";
import {
  signInWithMagicLink,
  signInWithPassword,
  type AuthState,
} from "@/app/actions/auth";
import { signInWithPhone } from "@/app/actions/whatsapp-invite";
import { PasswordInput } from "@/components/auth/password-input";

const initial: AuthState = {};
const input =
  "mt-2 w-full rounded-xl border border-line bg-cream px-4 py-3 text-ink outline-none transition-colors focus:border-accent";

/**
 * Phone number + password is the main way in — that's how WhatsApp-invited
 * clients sign in. Email (link or password) stays for those who use it.
 */
export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"phone" | "link" | "password">("phone");
  const [phoneState, phoneAction, phonePending] = useActionState(signInWithPhone, {});
  const [linkState, linkAction, linkPending] = useActionState(signInWithMagicLink, initial);
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, initial);

  const state = mode === "phone" ? phoneState : mode === "link" ? linkState : pwState;
  const pending = mode === "phone" ? phonePending : mode === "link" ? linkPending : pwPending;
  const action = mode === "phone" ? phoneAction : mode === "link" ? linkAction : pwAction;

  if (linkState.sent) {
    return (
      <div className="rounded-card border border-accent bg-accent-tint p-7">
        <h2 className="text-lg font-bold text-ink">Check your inbox</h2>
        <p className="mt-2 leading-relaxed text-muted">
          We have sent you a sign-in link. It expires in an hour, and it only works once.
        </p>
        <p className="mt-4 text-sm text-muted">Nothing arrived? Check spam, then message us on WhatsApp.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {mode === "phone" ? (
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-ink">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            required
            placeholder="0712 345 678"
            className={input}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@yourbusiness.co.ke"
            className={input}
          />
        </div>
      )}

      {mode !== "link" && (
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-ink">
            Password
          </label>
          <PasswordInput id="password" name="password" />
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl border border-line bg-cream-deep px-4 py-3 text-sm leading-relaxed text-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Working…" : mode === "link" ? "Email me a sign-in link" : "Sign in"}
      </button>

      {mode === "phone" ? (
        <>
          <p className="text-center text-sm text-muted">
            Forgot your password? Message us on WhatsApp and we&rsquo;ll send you a new link.
          </p>
          <button
            type="button"
            onClick={() => setMode("link")}
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Sign in with email instead
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "link" ? "password" : "link")}
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            {mode === "link" ? "Use an email password instead" : "Email me a link instead"}
          </button>
          <button
            type="button"
            onClick={() => setMode("phone")}
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Sign in with phone number
          </button>
        </div>
      )}
    </form>
  );
}
