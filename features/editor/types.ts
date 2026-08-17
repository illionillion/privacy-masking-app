/** マスキング種別 */
export type StampType = "mosaic" | "blur" | "stamp-face" | "fill-black" | "fill-text";

/** ペイントで使用できるマスキング種別 */
export type PaintType = "fill-black" | "mosaic" | "blur";

/** エディタの操作モード */
export type EditorMode = "select" | "rect" | "paint" | "crop";

/** 仮想トリミング矩形（元画像ピクセル空間） */
export interface CropRect {
  /** X座標（元画像ピクセル空間） */
  x: number;
  /** Y座標（元画像ピクセル空間） */
  y: number;
  /** 幅（元画像ピクセル空間） */
  width: number;
  /** 高さ（元画像ピクセル空間） */
  height: number;
}

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
  /**
   * 回転角（度、時計回り）。Konva Group と同じく領域の左上を原点とする。
   * 未設定・0 は無回転。
   */
  rotation?: number;
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
  /** fill-text 種別で領域に表示する文言 */
  overlayText?: string;
  /** fill-text 種別の文字色（CSS カラー） */
  textColor?: string;
  /** fill-text 種別の背景色（CSS カラー） */
  backgroundColor?: string;
  /** fill-text 種別で背景を塗らず透過するか（未設定は塗る） */
  isBackgroundTransparent?: boolean;
}

/** エディタ状態のスナップショット（モーダル閉鎖後の復元用） */
export interface EditorStateSnapshot {
  mode: EditorMode;
  stampRegions: StampRegion[];
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  selectedStampType: StampType;
  /** ペイントで新規ストロークへ適用する種別（旧スナップショットでは未設定） */
  selectedPaintType?: PaintType;
  selectedStampFileName: string;
  brushSize: number;
  /** 仮想 crop。null は元画像全体 */
  cropRect: CropRect | null;
}

/** ペイントストローク */
export interface PaintStroke {
  /** 一意のID */
  id: string;
  /** ストロークの座標点列（元画像ピクセル空間） */
  points: { x: number; y: number }[];
  /** ブラシサイズ */
  brushSize: number;
  /** マスキング種別（旧データの未設定時は黒塗り） */
  paintType?: PaintType;
  /** 有効/無効フラグ */
  isEnabled: boolean;
}
