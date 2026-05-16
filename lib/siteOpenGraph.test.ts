import { describe, expect, it } from "vitest";
import { HERO_OG_IMAGE, HERO_OG_IMAGE_PATH, SITE_SOCIAL_METADATA } from "./siteOpenGraph";

describe("siteOpenGraph", () => {
  it("ヒーロー画像パスが public 配下の hero.png を指す", () => {
    expect(HERO_OG_IMAGE_PATH).toBe("/hero.png");
    expect(HERO_OG_IMAGE.url).toBe(HERO_OG_IMAGE_PATH);
  });

  it("Twitter 大画像カード用の設定を含む", () => {
    expect(SITE_SOCIAL_METADATA.twitter.card).toBe("summary_large_image");
    expect(SITE_SOCIAL_METADATA.twitter.images).toEqual([HERO_OG_IMAGE_PATH]);
    expect(SITE_SOCIAL_METADATA.openGraph.images).toEqual([HERO_OG_IMAGE]);
  });
});
