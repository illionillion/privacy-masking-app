import type { Metadata } from "next";

/** OGP / Twitter カード用ヒーロー画像（`public/hero.png`） */
export const HERO_OG_IMAGE_PATH = "/hero.png";

const HERO_OG_IMAGE_ALT = "伏せ太郎 | Fusely - 画像内の顔・文字を、すばやくマスキング";

/** `openGraph.images` 用のヒーロー画像メタデータ */
export const HERO_OG_IMAGE = {
  url: HERO_OG_IMAGE_PATH,
  width: 1731,
  height: 909,
  alt: HERO_OG_IMAGE_ALT,
} as const;

/**
 * 全ページで共有する OGP 画像と Twitter 大画像カード設定。
 * 子ページの `openGraph` / `twitter` は親 layout の値を上書きするため、各ページで明示的にスプレッドする。
 */
export const SITE_SOCIAL_METADATA = {
  openGraph: {
    images: [HERO_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [HERO_OG_IMAGE_PATH],
  },
} as const satisfies Pick<Metadata, "openGraph" | "twitter">;
