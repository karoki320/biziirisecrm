import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import readingTime from "reading-time";

/**
 * Markdown-file blog. Posts live in content/blog/*.md and are rendered to HTML
 * at build time, so every post is a static file with no database and no query.
 *
 * `faqs` in the frontmatter does double duty: it renders as an FAQ block AND
 * emits FAQPage structured data. Neither of the Kenyan pages currently ranking
 * for these terms has FAQ schema, which is the cheapest rich-result win here.
 */

export type Faq = { q: string; a: string };

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  /** Primary keyword this post targets. One per post. */
  keyword: string;
  keywords: string[];
  /** Service slug this post feeds, for the internal link. */
  service?: string;
  faqs: Faq[];
  readingMinutes: number;
};

export type Post = PostMeta & { html: string };

const DIR = path.join(process.cwd(), "content", "blog");

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);

  return {
    slug: file.replace(/\.md$/, ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    updated: data.updated ? String(data.updated) : undefined,
    keyword: String(data.keyword ?? ""),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    service: data.service ? String(data.service) : undefined,
    faqs: Array.isArray(data.faqs) ? (data.faqs as Faq[]) : [],
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    html: marked.parse(content, { async: false }) as string,
  };
}

export function allPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(parse)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): Post | undefined {
  return allPosts().find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
