import Link from "next/link";
import type { Metadata } from "next";
import { art } from "@/lib/art";
import { HeaderBand } from "@/components/header-band";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { allPosts, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Straight answers on what websites, ecommerce, M-Pesa integration and social media actually cost in Kenya — and what you get for the money.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  const posts = allPosts();

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Straight answers, no sales pitch.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            The questions Kenyan business owners actually ask us, answered
            properly — with real numbers, including ours. If an article talks you
            out of hiring us, it has done its job.
          </p>

          <HeaderBand src={art.blog} priority />
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <ul className="mx-auto flex max-w-3xl flex-col gap-px overflow-hidden rounded-card border border-line bg-line px-0">
          {posts.map((post) => (
            <li key={post.slug} className="bg-cream">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-2 px-6 py-7 transition-colors hover:bg-cream-deep sm:px-8"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readingMinutes} min read</span>
                </div>
                <h2 className="text-xl font-bold leading-snug tracking-tight text-ink group-hover:text-accent sm:text-2xl">
                  {post.title}
                </h2>
                <p className="leading-relaxed text-muted">{post.description}</p>
              </Link>
            </li>
          ))}
        </ul>

        {posts.length === 0 && (
          <p className="mx-auto max-w-3xl px-5 text-muted">
            No posts yet.
          </p>
        )}
      </section>

      <section className="border-t border-line bg-cream-deep py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Question we have not answered yet?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Ask it on WhatsApp. If it is a good one we will write it up, and you
            get the answer either way.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context="Blog index" />
          </div>
        </div>
      </section>
    </>
  );
}
