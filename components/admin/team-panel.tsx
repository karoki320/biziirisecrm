"use client";

import { useActionState, useState } from "react";
import {
  inviteTeamMember,
  removeMember,
  revokeInvite,
  setMemberRole,
  type TeamState,
} from "@/app/actions/team";
import {
  ROLE_BLURBS,
  ROLE_LABELS,
  type InviteState,
  type TeamInvite,
  type TeamMember,
} from "@/lib/team-shared";

const EMPTY: TeamState = {};

function Notice({ state }: { state: TeamState }) {
  if (state.error) {
    return <p className="mt-3 text-sm font-medium text-danger">{state.error}</p>;
  }
  if (state.ok) {
    return <p className="mt-3 text-sm font-medium text-accent">{state.ok}</p>;
  }
  return null;
}

function ShareRow({ link, label }: { link: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const message = `${label} Use this link to set up your Biziirise login: ${link}`;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className="min-h-[48px] rounded-full border-2 border-accent text-sm font-bold text-accent"
      >
        {copied ? "Copied" : "Copy invite link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="grid min-h-[48px] place-items-center rounded-full bg-[#12805c] text-sm font-bold text-cream"
      >
        Send on WhatsApp
      </a>
    </div>
  );
}

/* ---------------- invite form ---------------- */

function InviteForm() {
  const [state, action, pending] = useActionState(inviteTeamMember, EMPTY);
  const [role, setRole] = useState<"admin" | "staff">("staff");

  const field =
    "mt-1.5 min-h-[52px] w-full rounded-xl border-2 border-line bg-cream px-4 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none";

  return (
    <form action={action} className="rounded-card border border-line bg-surface p-5">
      <h2 className="text-lg font-extrabold text-ink">Invite someone</h2>
      <p className="mt-1 text-sm text-muted">
        They get a link. Opening it signs them in and sets their access &mdash; no
        password to remember, nothing for you to set up afterwards.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inv-name" className="block text-sm font-semibold text-ink">
            Name
          </label>
          <input id="inv-name" name="fullName" className={field} placeholder="e.g. Faith" />
        </div>
        <div>
          <label htmlFor="inv-email" className="block text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="inv-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="inv-phone" className="block text-sm font-semibold text-ink">
          Phone / WhatsApp <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="inv-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          className={field}
          placeholder="07XX XXX XXX"
        />
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-ink">What they can see</legend>
        <input type="hidden" name="role" value={role} />
        <div className="mt-2 space-y-2">
          {(["staff", "admin"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              aria-pressed={role === value}
              className={`block w-full rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                role === value
                  ? "border-accent bg-accent-tint"
                  : "border-line bg-cream hover:border-accent"
              }`}
            >
              <span className="block text-sm font-bold text-ink">
                {ROLE_LABELS[value]}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">
                {ROLE_BLURBS[value]}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-[52px] w-full rounded-full bg-accent text-base font-bold text-cream disabled:bg-line disabled:text-muted sm:w-auto sm:px-8"
      >
        {pending ? "Creating…" : "Create invite link"}
      </button>

      <Notice state={state} />
      {state.link && <ShareRow link={state.link} label="Hi," />}
    </form>
  );
}

/* ---------------- member row ---------------- */

function MemberRow({ member, canEdit }: { member: TeamMember; canEdit: boolean }) {
  const [roleState, roleAction, rolePending] = useActionState(setMemberRole, EMPTY);
  const [removeState, removeAction, removePending] = useActionState(removeMember, EMPTY);

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-ink">
            {member.full_name || member.email || "Unnamed"}
          </p>
          {member.email && <p className="text-sm text-muted">{member.email}</p>}
          <p className="mt-0.5 text-xs text-muted">
            {ROLE_LABELS[member.role]}
            {member.last_sign_in_at
              ? ` · last in ${new Date(member.last_sign_in_at).toLocaleDateString("en-KE")}`
              : " · never signed in"}
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <form action={roleAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={member.id} />
              <label htmlFor={`role-${member.id}`} className="sr-only">
                Role for {member.full_name || member.email}
              </label>
              <select
                id={`role-${member.id}`}
                name="role"
                defaultValue={member.role}
                disabled={rolePending}
                className="min-h-[44px] rounded-xl border-2 border-line bg-cream px-3 text-sm font-semibold text-ink"
              >
                <option value="staff">Sales</option>
                <option value="admin">Owner</option>
              </select>
              <button
                type="submit"
                disabled={rolePending}
                className="min-h-[44px] rounded-full border-2 border-accent px-4 text-sm font-bold text-accent disabled:border-line disabled:text-muted"
              >
                Save
              </button>
            </form>

            <form action={removeAction}>
              <input type="hidden" name="id" value={member.id} />
              <button
                type="submit"
                disabled={removePending}
                className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-danger disabled:text-muted"
              >
                Remove
              </button>
            </form>
          </div>
        )}
      </div>
      <Notice state={roleState.error || roleState.ok ? roleState : removeState} />
    </li>
  );
}

/* ---------------- invite row ---------------- */

function InviteRow({
  invite,
  state,
  origin,
}: {
  invite: TeamInvite;
  state: InviteState;
  origin: string;
}) {
  const [revokeState, revokeAction, pending] = useActionState(revokeInvite, EMPTY);

  const badge =
    state === "open"
      ? "bg-accent-tint text-accent"
      : state === "accepted"
        ? "bg-line text-muted"
        : "bg-line text-muted";

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">
            {invite.full_name ? `${invite.full_name} · ` : ""}
            {invite.email}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {ROLE_LABELS[invite.role]} ·{" "}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge}`}>
              {state}
            </span>
          </p>
        </div>

        {state === "open" && (
          <form action={revokeAction}>
            <input type="hidden" name="id" value={invite.id} />
            <button
              type="submit"
              disabled={pending}
              className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-danger disabled:text-muted"
            >
              {pending ? "Revoking…" : "Revoke"}
            </button>
          </form>
        )}
      </div>

      {state === "open" && (
        <ShareRow
          link={`${origin}/invite/${invite.token}`}
          label={invite.full_name ? `Hi ${invite.full_name},` : "Hi,"}
        />
      )}
      <Notice state={revokeState} />
    </li>
  );
}

/* ---------------- the panel ---------------- */

export function TeamPanel({
  members,
  invites,
  origin,
  inviteStates,
}: {
  members: TeamMember[];
  invites: TeamInvite[];
  origin: string;
  inviteStates: Record<string, InviteState>;
}) {
  const open = invites.filter((i) => inviteStates[i.id] === "open");
  const rest = invites.filter((i) => inviteStates[i.id] !== "open");

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="text-lg font-extrabold text-ink">On the team</h2>
        <ul className="mt-2 divide-y divide-line">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} canEdit />
          ))}
        </ul>
      </section>

      <InviteForm />

      {open.length > 0 && (
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-lg font-extrabold text-ink">Waiting to be accepted</h2>
          <ul className="mt-2 divide-y divide-line">
            {open.map((i) => (
              <InviteRow key={i.id} invite={i} state="open" origin={origin} />
            ))}
          </ul>
        </section>
      )}

      {rest.length > 0 && (
        <section className="rounded-card border border-line bg-surface p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
            Past invites
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {rest.map((i) => (
              <InviteRow key={i.id} invite={i} state={inviteStates[i.id]} origin={origin} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
