import type { MetadataRoute } from "next";
import { loadBlogPostSlugs } from "@/lib/blog/loadBlogPosts";
import { loadGuidePostSlugs } from "@/lib/guides/loadGuidePosts";
import { loadUpdatePostSlugs } from "@/lib/loadUpdatePosts";
import { getSiteUrl } from "@/lib/siteUrl";
export const dynamic = "force-static";

/**
 * Search Console 向けの sitemap.xml を生成する。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const guideEntries = loadGuidePostSlugs().map((slug) => ({
    url: `${siteUrl}/guides/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const blogEntries = loadBlogPostSlugs().map((slug) => ({
    url: `${siteUrl}/blog/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const updateEntries = loadUpdatePostSlugs().map((slug) => ({
    url: `${siteUrl}/updates/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/app`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/faq`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/updates`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...guideEntries,
    ...blogEntries,
    ...updateEntries,
  ];
}
