import { DEFAULT_FUSELY_PREFS, type DetectionPrefs } from "@/lib/preferences";
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
  recognizeText: (
    imageElement: HTMLImageElement,
    options?: { customMaskTerms?: readonly string[] }
  ) => Promise<DetectedTextRegion[]>;
}

/** detectImageContent のオプション */
export interface DetectImageContentOptions {
  /** 検出設定（省略時は両方オン） */
  detectionSettings?: DetectionPrefs;
  /** ユーザー登録のマスク語句（OCR 有効時のみ適用） */
  customMaskTerms?: readonly string[];
}

/**
 * 画像 URL から HTMLImageElement を読み込み、設定に応じて顔検出・OCR を実行する
 *
 * @param imageUrl - 表示・検出用 Blob URL
 * @param deps - 顔検出・OCR 関数
 * @param options - 検出設定
 * @returns 検出結果と原画像サイズ
 */
export async function detectImageContent(
  imageUrl: string,
  deps: DetectImageContentDeps,
  options: DetectImageContentOptions = {}
): Promise<ImageDetectionResult> {
  const settings = options.detectionSettings ?? DEFAULT_FUSELY_PREFS.detection;
  const customMaskTerms = options.customMaskTerms ?? [];

  const imageElement = await loadImageElement(imageUrl);

  const facePromise = settings.autoDetectFace
    ? deps.detectFaces(imageElement)
    : Promise.resolve<DetectedFace[]>([]);
  const ocrPromise = settings.autoDetectOcr
    ? deps.recognizeText(imageElement, { customMaskTerms })
    : Promise.resolve<DetectedTextRegion[]>([]);

  const [detections, ocrRegions] = await Promise.all([facePromise, ocrPromise]);

  return {
    detections,
    ocrRegions,
    naturalWidth: imageElement.naturalWidth,
    naturalHeight: imageElement.naturalHeight,
  };
}

/**
 * 検出 API を呼ばずに処理完了状態へ遷移できるか
 *
 * @param settings - 検出設定
 */
export function shouldSkipAllDetection(settings: DetectionPrefs): boolean {
  return !settings.autoDetectFace && !settings.autoDetectOcr;
}
