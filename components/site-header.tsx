"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { site, whatsappLink } from "@/lib/site";
import { Logo } from "./logo";
import { WhatsAppCta } from "./whatsapp-cta";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Blog" },
];

function MenuGlyph({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" aria-hidden="true" className={className}>
      {open ? (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      ) : (
        <>
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link href="/" aria-label={`${site.name} home`} className="flex items-center gap-2.5">
          <Logo className="h-7 w-auto text-brand" />
          <span className="text-lg font-extrabold tracking-tight text-ink">{site.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-ink md:block"
          >
            Client login
          </Link>
          <div className="hidden sm:block">
            <WhatsAppCta size="md" label="WhatsApp us" context="Header" className="!w-auto" />
          </div>

          {/* Mobile: one button, 44px tap target, and the menu holds everything
              the desktop header has — including Client login, which used to
              vanish below the sm breakpoint. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 rounded-xl p-2.5 text-ink transition-colors hover:bg-cream-deep md:hidden"
          >
            <MenuGlyph open={open} className="h-6 w-6" />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-line bg-cream md:hidden"
        >
          <nav aria-label="Mobile" className="mx-auto max-w-6xl px-5 py-3">
            <ul className="divide-y divide-line/70">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-base font-semibold text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block py-4 text-base font-semibold text-ink"
                >
                  Client login
                </Link>
              </li>
            </ul>

            <a
              href={whatsappLink("Mobile menu")}
              target="_blank"
              rel="noopener noreferrer"
              data-cta="whatsapp"
              data-cta-context="Mobile menu"
              className="mt-3 mb-2 flex w-full items-center justify-center rounded-full bg-accent px-6 py-4
                         text-base font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              WhatsApp us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
