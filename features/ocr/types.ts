/**
 * OCR機能の型定義
 */

/** 個人情報パターン種別 */
export type OcrPatternType = "email" | "phone" | "postal" | "url" | "apikey" | "custom";

/** recognizeText のオプション */
export interface RecognizeTextOptions {
  /** ユーザー登録のマスク語句（OCR 有効時のみ適用） */
  customMaskTerms?: readonly string[];
}

/** OCRで検出された個人情報領域 */
export interface OcrRegion {
  /** 矩形のX座標 */
  x: number;
  /** 矩形のY座標 */
  y: number;
  /** 矩形の幅 */
  width: number;
  /** 矩形の高さ */
  height: number;
  /** 検出されたテキスト */
  text: string;
  /** マッチしたパターン種別 */
  patternType: OcrPatternType;
}

/** useOcr フックの戻り値 */
export interface UseOcrReturn {
  /** OCR処理中フラグ */
  isRecognizing: boolean;
  /** 検出された個人情報領域の一覧 */
  ocrRegions: OcrRegion[];
  /** OCRを実行して個人情報領域を返す関数 */
  recognizeText: (
    imageElement: HTMLImageElement,
    options?: RecognizeTextOptions
  ) => Promise<OcrRegion[]>;
}
