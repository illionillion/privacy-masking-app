import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/guides/loadGuidePosts", () => ({
  loadGuidePostSlugs: vi.fn(() => ["image-import"]),
}));

vi.mock("@/lib/loadUpdatePosts", () => ({
  loadUpdatePostSlugs: vi.fn(() => ["2026-06-10-ocr-phone-detection"]),
}));

vi.mock("@/lib/siteUrl", () => ({
  getSiteUrl: vi.fn(() => "https://example.com"),
}));

import sitemap from "./sitemap";

describe("sitemap", () => {
  it("使い方ガイド一覧と詳細を含める", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://example.com/guides");
    expect(urls).toContain("https://example.com/guides/image-import");
    expect(urls).toContain("https://example.com/search");
  });
});
