import type { MetadataRoute } from "next";

const DEFAULT_SITE_URL = "https://privacy-masking-app.pages.dev";
export const dynamic = "force-static";

/**
 * クローラー向けの robots.txt を生成する。
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
