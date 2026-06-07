import type { MaskingImageItem } from "../types";

/**
 * ギャラリー画像アイテムの imageUrl（Blob URL）を解放する
 *
 * @param items - 解放対象の画像アイテム一覧
 */
export function revokeGalleryItemImageUrls(items: MaskingImageItem[]): void {
  for (const item of items) {
    URL.revokeObjectURL(item.imageUrl);
  }
}
