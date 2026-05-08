const DEFAULT_SITE_URL = "https://privacy-masking-app.pages.dev";

/**
 * サイトURL文字列の末尾スラッシュを除去して正規化する。
 */
function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * 環境変数から公開サイトURLを解決する。
 *
 * `NEXT_PUBLIC_SITE_URL` が不正値の場合はデフォルトURLへフォールバックする。
 */
export function getSiteUrl(): string {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!rawSiteUrl) {
    return DEFAULT_SITE_URL;
  }

  const candidates = rawSiteUrl.includes("://")
    ? [rawSiteUrl]
    : [rawSiteUrl, `https://${rawSiteUrl}`];
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      const normalizedPath = parsed.pathname === "/" ? "" : parsed.pathname;
      return normalizeSiteUrl(`${parsed.origin}${normalizedPath}`);
    } catch {
      // 次の候補を試す。
    }
  }

  return DEFAULT_SITE_URL;
}

/**
 * Metadata API で利用する URL オブジェクトを返す。
 */
export function getSiteUrlAsUrl(): URL {
  return new URL(getSiteUrl());
}

/**
 * サイトURLを基準にパスを絶対URLへ解決する。
 */
export function resolveSiteUrl(path = ""): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const baseUrl = getSiteUrl();
  if (!normalizedPath) {
    return baseUrl;
  }

  return `${baseUrl}/${normalizedPath}`;
}
