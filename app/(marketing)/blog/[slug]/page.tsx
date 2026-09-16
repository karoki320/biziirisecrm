import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsAppCta } from "@/components/whatsapp-cta";
import { allPosts, getPost, formatDate } from "@/lib/blog";
import { getService } from "@/lib/services";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = `${site.url}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [site.legalName],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const service = post.service ? getService(post.service) : undefined;
  const url = `${site.url}/blog/${post.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@type": "Organization", name: site.legalName, url: site.url },
      publisher: { "@type": "Organization", name: site.legalName, url: site.url },
      inLanguage: "en-KE",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${site.url}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
    ...(post.faqs.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header className="border-b border-line">
          <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
            <Link
              href="/blog"
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <span aria-hidden="true">←</span> All articles
            </Link>

            <h1 className="mt-6 text-3xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-4xl">
              {post.title}
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-muted">
              {post.description}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updated && post.updated !== post.date && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>updated {formatDate(post.updated)}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-5 py-14">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-ink
              prose-h2:mt-14 prose-h2:text-2xl sm:prose-h2:text-3xl
              prose-h3:mt-10 prose-h3:text-xl
              prose-p:text-muted prose-p:leading-relaxed
              prose-li:text-muted prose-li:leading-relaxed
              prose-strong:text-ink prose-strong:font-semibold
              prose-a:text-accent prose-a:font-medium prose-a:underline-offset-2
              prose-table:text-[15px] prose-th:text-ink prose-td:text-muted
              prose-blockquote:border-accent prose-blockquote:text-ink prose-blockquote:not-italic
              prose-hr:border-line"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {post.faqs.length > 0 && (
            <section className="mt-16 border-t border-line pt-12">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Questions people ask us
              </h2>
              <dl className="mt-8 flex flex-col gap-px overflow-hidden rounded-card border border-line bg-line">
                {post.faqs.map((f) => (
                  <div key={f.q} className="bg-cream px-6 py-6">
                    <dt className="font-bold text-ink">{f.q}</dt>
                    <dd className="mt-2 leading-relaxed text-muted">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {service && (
            <aside className="mt-14 rounded-card border border-accent bg-accent-tint p-7">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                The service this is about
              </p>
              <h2 className="mt-3 text-xl font-bold text-ink">{service.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{service.cardBlurb}</p>
              <p className="mt-3 font-mono text-sm font-semibold text-accent">
                {service.priceHint}
              </p>
              <Link
                href={`/services/${service.slug}`}
                className="group mt-5 inline-flex items-center text-sm font-semibold text-accent"
              >
                See what is included
                <span
                  aria-hidden="true"
                  className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </aside>
          )}
        </div>
      </article>

      <section className="border-t border-line bg-cream-deep py-20">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Still deciding?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Send us the actual situation and we will tell you what we would do —
            even when the answer is that you do not need us yet.
          </p>
          <div className="mt-9 flex justify-center">
            <WhatsAppCta context={`Blog — ${post.title}`} />
          </div>
        </div>
      </section>
    </>
  );
}
