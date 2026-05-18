/** マスキング種別 */
export type StampType = "mosaic" | "blur" | "stamp-face" | "fill-black";

/** エディタの操作モード */
export type EditorMode = "select" | "rect" | "paint";

/** マスキング領域の発生源 */
export type StampRegionSource = "face-detection" | "ocr" | "manual";

/** マスキング領域（顔検出・OCR・手動追加を共通で表現） */
export interface StampRegion {
  /** 一意のID */
  id: string;
  /** X座標（元画像ピクセル空間） */
  x: number;
  /** Y座標（元画像ピクセル空間） */
  y: number;
  /** 幅（元画像ピクセル空間） */
  width: number;
  /** 高さ（元画像ピクセル空間） */
  height: number;
  /** マスキング種別 */
  stampType: StampType;
  /** stamp-face 種別で使用するスタンプ画像のファイル名 */
  stampFileName?: string;
  /** 有効/無効フラグ */
  isEnabled: boolean;
  /** 領域の発生源 */
  source: StampRegionSource;
  /** 検出テキスト（OCR 由来の場合） */
  text?: string;
}

/** エディタ状態のスナップショット（モーダル閉鎖後の復元用） */
export interface EditorStateSnapshot {
  mode: EditorMode;
  stampRegions: StampRegion[];
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  selectedStampType: StampType;
  selectedStampFileName: string;
  brushSize: number;
}

/** ペイントストローク */
export interface PaintStroke {
  /** 一意のID */
  id: string;
  /** ストロークの座標点列（元画像ピクセル空間） */
  points: { x: number; y: number }[];
  /** ブラシサイズ */
  brushSize: number;
  /** 有効/無効フラグ */
  isEnabled: boolean;
}
