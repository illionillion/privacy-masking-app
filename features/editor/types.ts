/** マスキング種別 */
export type StampType = "mosaic" | "blur" | "stamp-face" | "fill-black";

/** エディタの操作モード */
export type EditorMode = "select" | "rect" | "paint";

/** 矩形追加時のターゲット種別 */
export type RectAddTarget = "fill" | "stamp";

/** スタンプ（顔検出など）のマスキング領域 */
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
  source: "face-detection" | "manual";
}

/** テキスト塗りつぶし領域 */
export interface FillRegion {
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
  /** 有効/無効フラグ */
  isEnabled: boolean;
  /** 領域の発生源 */
  source: "ocr" | "manual";
  /** 検出テキスト（OCR由来の場合） */
  text?: string;
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
