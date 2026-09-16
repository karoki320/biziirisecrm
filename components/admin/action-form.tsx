"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/actions/admin";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * Small wrapper so every admin form gets pending state and inline feedback
 * without repeating useActionState in a dozen components.
 */
export function ActionForm({
  action,
  children,
  className = "",
  submitLabel,
  compact = false,
}: {
  action: Action;
  children?: React.ReactNode;
  className?: string;
  submitLabel: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className={
          compact
            ? "rounded-full border border-line px-3 py-1 font-mono text-[11px] font-medium text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            : "mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        }
      >
        {pending ? "Working…" : submitLabel}
      </button>

      {state.error && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-ink">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="mt-3 text-sm leading-relaxed text-accent">
          {state.ok}
        </p>
      )}
    </form>
  );
}
