import type { MaskingImageItem } from "../types";
import {
  detectImageContent,
  type DetectImageContentDeps,
  type ImageDetectionResult,
} from "./detectImageContent";

/** 検出フェーズの同時実行数デフォルト値 */
export const DETECTION_CONCURRENCY = 2;

/** runDetectionForGalleryItems のオプション */
export interface RunDetectionForGalleryItemsOptions extends DetectImageContentDeps {
  items: MaskingImageItem[];
  isMounted: () => boolean;
  concurrency?: number;
  onItemSuccess: (item: MaskingImageItem, result: ImageDetectionResult) => void;
  onItemFailure: (item: MaskingImageItem) => void;
}

/** runDetectionForGalleryItems の戻り値 */
export interface RunDetectionForGalleryItemsResult {
  detectionSucceededCount: number;
  detectionFailedCount: number;
}

/**
 * 並行数を制限しながら各画像の顔検出・OCR を実行する
 *
 * 全画像を同時処理するとモバイルで CPU/メモリが競合して逆に遅くなるため、
 * 同時実行数を concurrency に抑える。
 *
 * @param options - 検出対象・依存関数・コールバック
 * @returns 成功・失敗件数
 */
export async function runDetectionForGalleryItems(
  options: RunDetectionForGalleryItemsOptions
): Promise<RunDetectionForGalleryItemsResult> {
  const {
    items,
    isMounted,
    detectFaces,
    recognizeText,
    concurrency = DETECTION_CONCURRENCY,
    onItemSuccess,
    onItemFailure,
  } = options;

  let detectionSucceededCount = 0;
  let detectionFailedCount = 0;

  for (let i = 0; i < items.length; i += concurrency) {
    if (!isMounted()) break;
    const chunk = items.slice(i, i + concurrency);
    await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          const result = await detectImageContent(item.imageUrl, { detectFaces, recognizeText });
          if (isMounted()) {
            onItemSuccess(item, result);
            detectionSucceededCount++;
          }
        } catch {
          if (isMounted()) {
            onItemFailure(item);
            detectionFailedCount++;
          }
        }
      })
    );
  }

  return { detectionSucceededCount, detectionFailedCount };
}
