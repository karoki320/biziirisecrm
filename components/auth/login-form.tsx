"use client";

import { useActionState, useState } from "react";
import {
  signInWithMagicLink,
  signInWithPassword,
  type AuthState,
} from "@/app/actions/auth";

const initial: AuthState = {};

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"link" | "password">("link");
  const [linkState, linkAction, linkPending] = useActionState(signInWithMagicLink, initial);
  const [pwState, pwAction, pwPending] = useActionState(signInWithPassword, initial);

  const state = mode === "link" ? linkState : pwState;
  const pending = mode === "link" ? linkPending : pwPending;

  if (linkState.sent) {
    return (
      <div className="rounded-card border border-accent bg-accent-tint p-7">
        <h2 className="text-lg font-bold text-ink">Check your inbox</h2>
        <p className="mt-2 leading-relaxed text-muted">
          We have sent you a sign-in link. It expires in an hour, and it only
          works once.
        </p>
        <p className="mt-4 text-sm text-muted">
          Nothing arrived? Check spam, then message us on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form action={mode === "link" ? linkAction : pwAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

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
          className="mt-2 w-full rounded-xl border border-line bg-cream px-4 py-3 text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      {mode === "password" && (
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 w-full rounded-xl border border-line bg-cream px-4 py-3 text-ink outline-none transition-colors focus:border-accent"
          />
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

      <button
        type="button"
        onClick={() => setMode(mode === "link" ? "password" : "link")}
        className="text-sm font-medium text-accent underline-offset-2 hover:underline"
      >
        {mode === "link" ? "Use a password instead" : "Email me a link instead"}
      </button>
    </form>
  );
}
