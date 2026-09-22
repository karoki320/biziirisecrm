import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-cream-deep">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <Logo className="h-7 w-auto text-brand" />
            <p className="text-lg font-extrabold tracking-tight text-ink">
              {site.name}
            </p>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            {site.tagline} Built in Nairobi.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Company</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            <li><Link className="hover:text-ink" href="/services">Services</Link></li>
            <li><Link className="hover:text-ink" href="/work">Work</Link></li>
            <li><Link className="hover:text-ink" href="/blog">Blog</Link></li>
            <li><Link className="hover:text-ink" href="/login">Client portal</Link></li>
            <li><Link className="hover:text-ink" href="/terms">Terms</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Talk to us</h2>
          <address className="mt-4 text-sm not-italic leading-relaxed text-muted">
            <a className="hover:text-ink" href={site.mapsUrl} target="_blank" rel="noopener noreferrer">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.countryName}
            </a>
          </address>
          <ul className="mt-2.5 space-y-2.5 text-sm text-muted">
            <li>
              <a className="hover:text-ink" href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
            </li>
            <li>
              <a className="hover:text-ink" href={`mailto:${site.email}`}>{site.email}</a>
            </li>
            <li>
              <a className="hover:text-ink" href={site.socials.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            </li>
            <li>
              <a className="hover:text-ink" href={site.socials.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs text-muted">
          © {new Date().getFullYear()} {site.legalName}. Nairobi, Kenya.
        </p>
      </div>
    </footer>
  );
}
