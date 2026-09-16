import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./logo";
import { WhatsAppCta } from "./whatsapp-cta";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          aria-label={`${site.name} home`}
          className="flex items-center gap-2.5"
        >
          <Logo className="h-7 w-auto text-brand" />
          <span className="text-lg font-extrabold tracking-tight text-ink">
            {site.name}
          </span>
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

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted transition-colors hover:text-ink sm:block"
          >
            Client login
          </Link>
          <WhatsAppCta size="md" label="WhatsApp us" context="Header" className="!w-auto" />
        </div>
      </div>
    </header>
  );
}
