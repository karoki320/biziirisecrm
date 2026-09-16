import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { allPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core = ["", "/services", "/work", "/blog"].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: (path === "/blog" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: path === "" ? 1 : 0.8,
  }));

  const servicePages = services.map((s) => ({
    url: `${site.url}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const posts = allPosts().map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.updated ?? p.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...core, ...servicePages, ...posts];
}
