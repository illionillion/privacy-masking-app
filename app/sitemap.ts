import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://privacy-masking-app.pages.dev";

/**
 * Search Console 向けの sitemap.xml を生成する。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/lp`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
