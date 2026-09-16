import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.legalName} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description:
    "Company profile websites from KES 10,000, ecommerce from KES 35,000, digital marketing from KES 20,000 a month. Built in Nairobi for Kenyan businesses. Talk to us on WhatsApp.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.legalName,
    title: `${site.legalName} — ${site.tagline}`,
    description:
      "Websites, ecommerce, digital marketing and custom builds, made in Nairobi for Kenyan businesses.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fcf9f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
