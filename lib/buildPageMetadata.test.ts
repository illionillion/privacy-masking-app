import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "./buildPageMetadata";
import { SITE_SOCIAL_METADATA } from "./siteOpenGraph";

describe("buildPageMetadata", () => {
  it("canonicalPath 指定時に OGP 画像と Twitter 大画像カードを含む", () => {
    const metadata = buildPageMetadata({
      title: "テスト",
      description: "説明",
      canonicalPath: "lp",
    });

    expect(metadata.openGraph?.images).toEqual(SITE_SOCIAL_METADATA.openGraph.images);
    expect(metadata.openGraph?.url).toMatch(/\/lp$/);
    expect(metadata.twitter).toEqual({
      title: "テスト",
      description: "説明",
      ...SITE_SOCIAL_METADATA.twitter,
    });
  });

  it("canonicalPath 省略時は openGraph / twitter を付けない", () => {
    const metadata = buildPageMetadata({
      title: "タイトルのみ",
    });

    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });
});
