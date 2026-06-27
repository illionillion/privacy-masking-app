import { HEIC_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from "./constants";

/**
 * ファイルが HEIC / HEIF 形式かどうかを判定する
 *
 * iOS では `file.type` が空のまま `.heic` 拡張子だけ付くことがあるため、MIME と拡張子の両方を見る。
 *
 * @param file - 判定対象の File
 * @returns HEIC / HEIF とみなせる場合は true
 */
export function isHeicFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if ((HEIC_IMAGE_TYPES as readonly string[]).includes(mime)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".heic") || lowerName.endsWith(".heif");
}

/**
 * HEIC / HEIF ファイルが正規化処理で JPEG 変換されるかどうかを判定する
 *
 * サイズ超過の HEIC は変換されずエラーになるため、ローディング表示の判定に使う。
 *
 * @param file - 判定対象の File
 * @returns 変換が実行される見込みがある場合は true
 */
export function willConvertHeicFile(file: File): boolean {
  return isHeicFile(file) && file.size <= MAX_IMAGE_FILE_SIZE;
}
