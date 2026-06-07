import type { DetectedFace, DetectedTextRegion } from "../types";
import { loadImageElement } from "./loadImageElement";

/** 顔検出・OCR の実行結果 */
export interface ImageDetectionResult {
  detections: DetectedFace[];
  ocrRegions: DetectedTextRegion[];
  naturalWidth: number;
  naturalHeight: number;
}

/** detectImageContent の依存関数 */
export interface DetectImageContentDeps {
  detectFaces: (imageElement: HTMLImageElement) => Promise<DetectedFace[]>;
  recognizeText: (imageElement: HTMLImageElement) => Promise<DetectedTextRegion[]>;
}

/**
 * 画像 URL から HTMLImageElement を読み込み、顔検出と OCR を並行実行する
 *
 * @param imageUrl - 表示・検出用 Blob URL
 * @param deps - 顔検出・OCR 関数
 * @returns 検出結果と原画像サイズ
 */
export async function detectImageContent(
  imageUrl: string,
  deps: DetectImageContentDeps
): Promise<ImageDetectionResult> {
  const imageElement = await loadImageElement(imageUrl);
  const [detections, ocrRegions] = await Promise.all([
    deps.detectFaces(imageElement),
    deps.recognizeText(imageElement),
  ]);

  return {
    detections,
    ocrRegions,
    naturalWidth: imageElement.naturalWidth,
    naturalHeight: imageElement.naturalHeight,
  };
}
