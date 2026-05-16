import type { StampRegion } from "../types";

/**
 * スタンプ画像マップから画像を選択する
 *
 * region.stampFileName が設定されている場合はそれを優先し、
 * 未設定の場合は region.id ハッシュで決定的に選択する。
 *
 * @param region - StampRegion
 * @param stampImages - ファイル名をキーにした HTMLImageElement の Map
 * @returns 選択された HTMLImageElement、見つからない場合は null
 */
export function pickStampImage(
  region: StampRegion,
  stampImages: Map<string, HTMLImageElement>
): HTMLImageElement | null {
  if (region.stampFileName) {
    return stampImages.get(region.stampFileName) ?? null;
  }
  const values = Array.from(stampImages.values());
  if (values.length === 0) return null;
  const idHash = region.id.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  return values[Math.abs(idHash) % values.length] ?? null;
}
