import type { ImageDetectionResult } from "./detectImageContent";
import type { MaskingImageItem } from "../types";

/**
 * 検出成功結果を MaskingImageItem に反映する
 *
 * @param image - 更新対象の画像アイテム
 * @param result - 顔検出・OCR の結果
 * @returns 検出完了状態の画像アイテム
 */
export function applyDetectionSuccess(
  image: MaskingImageItem,
  result: ImageDetectionResult
): MaskingImageItem {
  return {
    ...image,
    detections: result.detections,
    ocrRegions: result.ocrRegions,
    naturalWidth: result.naturalWidth,
    naturalHeight: result.naturalHeight,
    isProcessing: false,
  };
}

/**
 * 自動検出をスキップした状態を MaskingImageItem に反映する
 *
 * @param image - 更新対象の画像アイテム
 * @returns 検出スキップ完了状態の画像アイテム
 */
export function applyDetectionSkipped(image: MaskingImageItem): MaskingImageItem {
  return {
    ...image,
    detections: [],
    ocrRegions: [],
    isProcessing: false,
    processingError: false,
  };
}

/**
 * 検出失敗状態を MaskingImageItem に反映する
 *
 * @param image - 更新対象の画像アイテム
 * @returns 検出失敗状態の画像アイテム
 */
export function applyDetectionFailure(image: MaskingImageItem): MaskingImageItem {
  return {
    ...image,
    isProcessing: false,
    processingError: true,
  };
}
