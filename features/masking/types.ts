/**
 * マスキング機能の型定義
 *
 * 他 feature への依存を避けるため、masking 側で必要な最小構造型をローカル定義する。
 * 実際の型（FaceDetectionResult / OcrRegion）と構造的互換性があれば代入可能。
 */

/**
 * 顔検出結果の最小構造型
 * FaceDetectionResult と構造的互換性を持つ
 */
export interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}

/**
 * OCR 検出領域の個人情報種別
 * OcrPatternType と同一の union 型をローカル定義し features/ocr への依存を避ける
 */
export type DetectedTextPatternType = "email" | "phone" | "postal" | "url" | "apikey";

/**
 * OCR 検出領域の最小構造型
 * OcrRegion と構造的互換性を持つ
 */
export interface DetectedTextRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  patternType: DetectedTextPatternType;
}

/** マスキング対象領域の種別 */
export type MaskRegionType = "face" | "manual";

/** マスキング対象の矩形領域 */
export interface MaskRegion {
  /** 一意のID */
  id: string;
  /** 矩形のX座標 */
  x: number;
  /** 矩形のY座標 */
  y: number;
  /** 矩形の幅 */
  width: number;
  /** 矩形の高さ */
  height: number;
  /** 領域の有効/無効フラグ */
  isEnabled: boolean;
  /** 領域の種別（顔検出 or 手動追加） */
  type: MaskRegionType;
}

/** useMaskingRegions フックの戻り値 */
export interface UseMaskingRegionsReturn {
  /** マスキング領域の一覧 */
  regions: MaskRegion[];
  /** 領域の有効/無効を切り替える */
  toggleRegion: (id: string) => void;
  /** 領域を追加する */
  addRegion: (region: Omit<MaskRegion, "id" | "isEnabled">) => void;
  /** 複数の領域を一括でセットする（既存領域は置き換え） */
  setRegions: (regions: Omit<MaskRegion, "id" | "isEnabled">[]) => void;
  /** 領域を削除する */
  removeRegion: (id: string) => void;
  /** すべての領域をリセットする */
  resetRegions: () => void;
}

/** ギャラリーの個別画像アイテム */
export interface MaskingImageItem {
  id: string;
  name: string;
  size: number;
  /** 表示・検出用 Blob URL（使用後は revokeObjectURL で解放する） */
  imageUrl: string;
  detections: DetectedFace[];
  /** OCRで検出された個人情報領域 */
  ocrRegions: DetectedTextRegion[];
  /** マスキング済み画像の Blob URL（FaceDetectionCanvas の onRendered から渡される） */
  maskedBlobUrl: string | null;
  /** 顔検出・OCR 処理中フラグ */
  isProcessing: boolean;
}

/**
 * ダウンロード時のファイル名を生成する
 *
 * @param originalName - 元ファイル名
 * @returns マスク済みファイル名（拡張子を .png に変換）
 */
export const createDownloadFileName = (originalName: string): string => {
  const extensionIndex = originalName.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return `${originalName}-masked.png`;
  }
  const basename = originalName.slice(0, extensionIndex);
  return `${basename}-masked.png`;
};
