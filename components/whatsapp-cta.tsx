import Link from "next/link";
import { whatsappLink } from "@/lib/site";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.9 2.4 1.02 2.56c.12.17 1.76 2.68 4.26 3.76.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}

type Props = {
  /** Attribution appended to the pre-filled message, e.g. "Services page". */
  context?: string;
  label?: string;
  size?: "lg" | "md";
  variant?: "solid" | "outline";
  className?: string;
};

/**
 * The one action the whole marketing site exists to produce.
 * No form, no modal, no intermediate step — straight into WhatsApp.
 */
export function WhatsAppCta({
  context,
  label = "Chat with us on WhatsApp",
  size = "lg",
  variant = "solid",
  className = "",
}: Props) {
  const sizing =
    size === "lg"
      ? "text-lg sm:text-xl px-8 py-5 gap-3"
      : "text-base px-6 py-3.5 gap-2.5";

  const skin =
    variant === "solid"
      ? "bg-accent text-white hover:bg-accent-hover shadow-[0_10px_30px_-12px_rgba(11,92,135,0.75)]"
      : "border-2 border-accent text-accent hover:bg-accent-tint";

  return (
    <Link
      href={whatsappLink(context)}
      target="_blank"
      rel="noopener noreferrer"
      data-cta="whatsapp"
      data-cta-context={context ?? "unknown"}
      className={`inline-flex w-full sm:w-auto items-center justify-center rounded-full font-semibold transition-colors duration-150 ${sizing} ${skin} ${className}`}
    >
      <WhatsAppGlyph className="h-6 w-6 shrink-0" />
      {label}
    </Link>
  );
}
