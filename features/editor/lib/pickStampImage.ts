import { STAMP_FILE_NAMES } from "../constants";
import type { StampRegion } from "../types";

/**
 * 領域に対応するスタンプ画像ファイル名を解決する
 *
 * stampFileName が設定済みならそれを返し、未設定なら region.id のハッシュで
 * fileNames から決定的に選ぶ（キャンバス表示・プルダウン・初期化で共通利用）。
 *
 * @param region - id と任意の stampFileName
 * @param fileNames - 候補ファイル名一覧（挿入順がハッシュ選択に使われる）
 * @returns 解決したファイル名。候補が空なら undefined
 */
export function resolveStampFileName(
  region: Pick<StampRegion, "id" | "stampFileName">,
  fileNames: readonly string[] = STAMP_FILE_NAMES
): string | undefined {
  if (region.stampFileName) {
    return region.stampFileName;
  }
  if (fileNames.length === 0) return undefined;
  const idHash = region.id.split("").reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  return fileNames[Math.abs(idHash) % fileNames.length];
}

/**
 * スタンプ画像マップから画像を選択する
 *
 * region.stampFileName が設定されている場合はそれを優先し、
 * 未設定の場合は STAMP_FILE_NAMES（カタログ順）に対する id ハッシュで決定的に選ぶ。
 * Map の挿入順（画像 onload 完了順）には依存しない。
 *
 * @param region - StampRegion
 * @param stampImages - ファイル名をキーにした HTMLImageElement の Map
 * @returns 選択された HTMLImageElement、見つからない場合は null
 */
export function pickStampImage(
  region: StampRegion,
  stampImages: Map<string, HTMLImageElement>
): HTMLImageElement | null {
  if (stampImages.size === 0) return null;
  const fileName = resolveStampFileName(region, STAMP_FILE_NAMES);
  if (!fileName) return null;
  return stampImages.get(fileName) ?? null;
}
