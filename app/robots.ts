import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
export const dynamic = "force-static";

/**
 * クローラー向けの robots.txt を生成する。
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
