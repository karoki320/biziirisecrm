"use client";

import { useActionState, useState } from "react";
import { createWhatsAppInvite, type WhatsAppInviteState } from "@/app/actions/whatsapp-invite";
import { AgreementChoice } from "@/components/admin/agreement-choice";

const field =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent";

/** Invite by WhatsApp: make the link, then send it from your own WhatsApp in one tap. */
export function WhatsAppInviteForm({
  clientId,
  defaultPhone,
  services,
  projects,
}: {
  clientId: string;
  defaultPhone: string;
  services: string[];
  projects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<WhatsAppInviteState, FormData>(createWhatsAppInvite, {});
  const [sign, setSign] = useState(true);
  const [copied, setCopied] = useState(false);

  return (
    <form action={action}>
      <input type="hidden" name="clientId" value={clientId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Their WhatsApp number</span>
          <input name="phone" type="tel" required defaultValue={defaultPhone} placeholder="0712 345 678" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Their name (optional)</span>
          <input name="fullName" placeholder="e.g. Dorcas Kimani" className={field} />
        </label>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="requestSignature"
          checked={sign}
          onChange={(e) => setSign(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        />
        <span className="text-sm leading-relaxed text-ink">Ask them to sign an agreement once they&rsquo;re in</span>
      </label>
      {sign && <AgreementChoice services={services} projects={projects} />}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Working…" : "Create WhatsApp invite"}
      </button>

      {state.error && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-ink">{state.error}</p>
      )}

      {state.whatsappUrl && state.link && (
        <div className="mt-5 rounded-xl border border-accent bg-accent-tint p-4">
          <p className="text-sm leading-relaxed text-ink">{state.ok}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-[#1f8f4e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#18733e]"
            >
              Send on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(state.link!).then(() => setCopied(true));
              }}
              className="rounded-full border border-line bg-cream px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent"
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
