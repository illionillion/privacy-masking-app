/**
 * `NEXT_PUBLIC_BASE_PATH` を考慮した公開アセット URL を生成する。
 *
 * @param assetPath - `public` 配下のアセット相対パス
 * @returns ベースパスを考慮した公開 URL
 */
export function buildPublicAssetPath(assetPath: string): string {
  const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const normalizedBasePath =
    rawBasePath === "/" || rawBasePath.length === 0
      ? ""
      : `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`;
  const normalizedAssetPath = assetPath.replace(/^\/+/, "");
  return `${normalizedBasePath}/${normalizedAssetPath}`;
}
