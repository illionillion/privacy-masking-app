import type { Metadata } from "next";
import { SITE_SOCIAL_METADATA } from "@/lib/siteOpenGraph";
import { resolveSiteUrl } from "@/lib/siteUrl";

type BuildPageMetadataOptions = {
  /** ページ固有の `<title>`。省略時は layout の default を使用 */
  title?: string;
  /** ページ固有の description。省略時は layout の default を使用 */
  description?: string;
  /**
   * canonical / og:url 用パス（`"lp"` / `"privacy"` / `"./"` など）。
   * 指定したページだけ openGraph・twitter を組み立てる（下記コメント参照）。
   */
  canonicalPath?: string;
  robots?: Metadata["robots"];
};

/**
 * ページ用 metadata を組み立てる。
 *
 * Next.js は子の `openGraph` / `twitter` を親と**フィールド単位ではマージせず**、
 * 子がオブジェクトを定義すると親の同オブジェクトをまるごと置き換える。
 * そのため `openGraph: { url }` だけ書くと layout の `images` が消える。
 *
 * 一方、子が openGraph / twitter を**一切書かない**場合は layout の OGP 画像は残るが、
 * `og:url` は自動では付かない（canonical だけでは不足）。
 *
 * このヘルパーは url・画像・Twitter カードを常にセットで付与し、各 page の重複を防ぐ。
 */
export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const { title, description, canonicalPath, robots } = options;

  const metadata: Metadata = {};

  if (title !== undefined) {
    metadata.title = title;
  }
  if (description !== undefined) {
    metadata.description = description;
  }
  if (robots !== undefined) {
    metadata.robots = robots;
  }
  if (canonicalPath !== undefined) {
    metadata.alternates = { canonical: canonicalPath };
  }

  if (canonicalPath === undefined) {
    return metadata;
  }

  const pageUrl = resolveSiteUrl(canonicalPath === "./" ? "" : canonicalPath);

  metadata.openGraph = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    url: pageUrl,
    ...SITE_SOCIAL_METADATA.openGraph,
  };

  metadata.twitter = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...SITE_SOCIAL_METADATA.twitter,
  };

  return metadata;
}
