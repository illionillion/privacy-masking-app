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
  /** 顔検出処理中フラグ */
  isDetecting: boolean;
  /** 検出された顔の一覧 */
  detections: FaceDetectionResult[];
  /** エラーメッセージ */
  error: string | null;
  /** 顔検出を実行する関数 */
  detectFaces: (imageElement: HTMLImageElement) => Promise<FaceDetectionResult[]>;
}
