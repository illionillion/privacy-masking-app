import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
export const dynamic = "force-static";

/**
 * Search Console 向けの sitemap.xml を生成する。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

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
