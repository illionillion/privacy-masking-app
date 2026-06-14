import type { MetadataRoute } from "next";
import { loadAllUpdatePosts } from "@/lib/loadUpdatePosts";
import { getSiteUrl } from "@/lib/siteUrl";
export const dynamic = "force-static";

/**
 * Search Console 向けの sitemap.xml を生成する。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const updateEntries = loadAllUpdatePosts().map((post) => ({
    url: `${siteUrl}/updates/${post.slug}`,
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
    ...updateEntries,
  ];
}
