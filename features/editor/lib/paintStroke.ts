import type { PaintStroke, PaintType } from "../types";

/** 種別未設定のペイントストロークに適用する既定種別 */
export const DEFAULT_PAINT_TYPE: PaintType = "fill-black";

/** モザイクブロックの最小サイズ（px） */
export const MIN_PAINT_MOSAIC_BLOCK_SIZE = 3;

/** ぼかし半径の最小値（px） */
export const MIN_PAINT_BLUR_RADIUS = 4;

/** ブラシ幅に対するモザイクブロックサイズの除数 */
const MOSAIC_BLOCK_DIVISOR = 5;

/** ブラシ幅に対するぼかし半径の除数 */
const BLUR_RADIUS_DIVISOR = 8;

/** ストローク外接矩形に加える余白の最小値（px） */
const MIN_BOUNDS_PADDING = 2;

/** ストローク外接矩形に加える余白（ブラシ半径への加算分、px） */
const BOUNDS_PADDING_MARGIN = 8;

/**
 * ペイントストロークの種別を解決する
 *
 * 旧スナップショットには種別が無いため、未設定は黒塗りとして扱う。
 *
 * @param stroke - 対象のストローク
 */
export function resolvePaintType(stroke: Pick<PaintStroke, "paintType">): PaintType {
  return stroke.paintType ?? DEFAULT_PAINT_TYPE;
}

/**
 * モザイクのブロックサイズを算出する
 *
 * プレビュー（表示ピクセル）と書き出し（元画像ピクセル）で見た目を揃えるため、
 * 外接矩形ではなくブラシ幅を基準にする。
 *
 * @param brushWidth - 描画に使うブラシ幅（対象の座標系でのピクセル）
 */
export function computePaintMosaicBlockSize(brushWidth: number): number {
  return Math.max(MIN_PAINT_MOSAIC_BLOCK_SIZE, Math.round(brushWidth / MOSAIC_BLOCK_DIVISOR));
}

/**
 * ぼかし半径を算出する
 *
 * @param brushWidth - 描画に使うブラシ幅（対象の座標系でのピクセル）
 */
export function computePaintBlurRadius(brushWidth: number): number {
  return Math.max(MIN_PAINT_BLUR_RADIUS, Math.round(brushWidth / BLUR_RADIUS_DIVISOR));
}

/** ストロークの外接矩形（対象の座標系でのピクセル） */
export interface PaintStrokeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * ストロークの外接矩形を、ブラシ幅ぶんの余白付きで求める
 *
 * @param points - 対象座標系へ変換済みの点列
 * @param brushWidth - ブラシ幅（対象の座標系でのピクセル）
 * @param maxWidth - クランプ先の幅（キャンバス幅など）
 * @param maxHeight - クランプ先の高さ（キャンバス高さなど）
 */
export function computePaintStrokeBounds(
  points: { x: number; y: number }[],
  brushWidth: number,
  maxWidth: number,
  maxHeight: number
): PaintStrokeBounds {
  const padding = Math.max(MIN_BOUNDS_PADDING, brushWidth / 2 + BOUNDS_PADDING_MARGIN);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.max(0, Math.floor(Math.min(...xs) - padding));
  const y = Math.max(0, Math.floor(Math.min(...ys) - padding));
  const right = Math.min(maxWidth, Math.ceil(Math.max(...xs) + padding));
  const bottom = Math.min(maxHeight, Math.ceil(Math.max(...ys) + padding));

  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  };
}
