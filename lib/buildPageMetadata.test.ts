import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "./buildPageMetadata";
import { SITE_SOCIAL_METADATA } from "./siteOpenGraph";
import { getSiteUrl } from "./siteUrl";

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

  it("canonicalPath が ./ のときサイト直下 URL に解決する", () => {
    const metadata = buildPageMetadata({ canonicalPath: "./" });

    expect(metadata.alternates?.canonical).toBe("./");
    expect(metadata.openGraph?.url).toBe(getSiteUrl());
  });

  /**
   * トップ（/）向け: title / description は layout に任せ、openGraph には url と画像のみ載せる。
   * og:title 等は Next.js が layout の title / description から補完する（ビルド HTML で確認済み）。
   */
  it("title / description 省略時は openGraph / twitter に同名フィールドを載せない", () => {
    const metadata = buildPageMetadata({ canonicalPath: "./" });

    expect(metadata.title).toBeUndefined();
    expect(metadata.description).toBeUndefined();
    expect(metadata.openGraph).toEqual({
      url: getSiteUrl(),
      ...SITE_SOCIAL_METADATA.openGraph,
    });
    expect(metadata.twitter).toEqual(SITE_SOCIAL_METADATA.twitter);
  });

  it("canonicalPath 省略時は openGraph / twitter を付けない", () => {
    const metadata = buildPageMetadata({
      title: "タイトルのみ",
    });

    expect(metadata.openGraph).toBeUndefined();
    expect(metadata.twitter).toBeUndefined();
  });
});
