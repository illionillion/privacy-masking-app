/**
 * 顔検出機能の型定義
 */

/** 検出された顔の矩形領域 */
export interface FaceDetectionResult {
  /** 矩形のX座標 */
  x: number;
  /** 矩形のY座標 */
  y: number;
  /** 矩形の幅 */
  width: number;
  /** 矩形の高さ */
  height: number;
  /** 検出スコア (0〜1) */
  score: number;
}

/** useFaceDetection フックの戻り値 */
export interface UseFaceDetectionReturn {
  /** モデルロード中フラグ */
  isModelLoading: boolean;
  /** モデルロード失敗フラグ（true の場合、顔検出は使用不可） */
  isModelError: boolean;
  /** 顔検出処理中フラグ */
  isDetecting: boolean;
  /** 顔検出を実行する関数 */
  detectFaces: (imageElement: HTMLImageElement) => Promise<FaceDetectionResult[]>;
}
