import { HEIC_IMAGE_TYPES } from "@/components/ImageUpload/constants";

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
