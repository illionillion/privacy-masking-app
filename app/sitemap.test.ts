import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/guides/loadGuidePosts", () => ({
  loadGuidePostSlugs: vi.fn(() => ["image-import"]),
}));

vi.mock("@/lib/blog/loadBlogPosts", () => ({
  loadBlogPostSlugs: vi.fn(() => ["2026-07-08-event-photo-face-masking"]),
}));

vi.mock("@/lib/loadUpdatePosts", () => ({
  loadUpdatePostSlugs: vi.fn(() => ["2026-06-10-ocr-phone-detection"]),
}));

vi.mock("@/lib/siteUrl", () => ({
  getSiteUrl: vi.fn(() => "https://example.com"),
}));

import sitemap from "./sitemap";

describe("sitemap", () => {
  it("使い方ガイド・ブログ・更新情報の一覧と詳細を含める", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://example.com/guides");
    expect(urls).toContain("https://example.com/guides/image-import");
    expect(urls).toContain("https://example.com/blog");
    expect(urls).toContain("https://example.com/blog/2026-07-08-event-photo-face-masking");
    expect(urls).toContain("https://example.com/updates");
    expect(urls).toContain("https://example.com/updates/2026-06-10-ocr-phone-detection");
    expect(urls).not.toContain("https://example.com/search");
  });
});
