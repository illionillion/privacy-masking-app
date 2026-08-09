import type { CropRect } from "../types";

/** crop の最小辺（元画像ピクセル）。画像自体が小さい場合は画像辺に合わせる */
export const MIN_CROP_SIZE = 16;

/** フル画像判定の許容誤差（Transformer 由来の小数用） */
const FULL_IMAGE_EPSILON = 0.5;

/**
 * 画像全体を覆う crop 矩形を返す
 *
 * @param imageWidth - 元画像幅
 * @param imageHeight - 元画像高さ
 */
export function createFullImageCropRect(imageWidth: number, imageHeight: number): CropRect {
  return { x: 0, y: 0, width: imageWidth, height: imageHeight };
}

/**
 * crop が実質画像全体か
 *
 * @param rect - 判定対象
 * @param imageWidth - 元画像幅
 * @param imageHeight - 元画像高さ
 */
export function isFullImageCrop(rect: CropRect, imageWidth: number, imageHeight: number): boolean {
  return (
    Math.abs(rect.x) <= FULL_IMAGE_EPSILON &&
    Math.abs(rect.y) <= FULL_IMAGE_EPSILON &&
    Math.abs(rect.width - imageWidth) <= FULL_IMAGE_EPSILON &&
    Math.abs(rect.height - imageHeight) <= FULL_IMAGE_EPSILON
  );
}

/**
 * crop を画像内に収め、最小サイズを保証する
 *
 * @param rect - 入力矩形
 * @param imageWidth - 元画像幅
 * @param imageHeight - 元画像高さ
 */
export function clampCropRect(rect: CropRect, imageWidth: number, imageHeight: number): CropRect {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const minW = Math.min(MIN_CROP_SIZE, imageWidth);
  const minH = Math.min(MIN_CROP_SIZE, imageHeight);
  const width = Math.min(imageWidth, Math.max(minW, rect.width));
  const height = Math.min(imageHeight, Math.max(minH, rect.height));
  let x = rect.x;
  let y = rect.y;
  if (x + width > imageWidth) {
    x = imageWidth - width;
  }
  if (y + height > imageHeight) {
    y = imageHeight - height;
  }
  x = Math.max(0, x);
  y = Math.max(0, y);
  return { x, y, width, height };
}

/**
 * 適用用に正規化する。フル画像なら null（未 crop）
 *
 * @param rect - 入力矩形
 * @param imageWidth - 元画像幅
 * @param imageHeight - 元画像高さ
 */
export function normalizeAppliedCropRect(
  rect: CropRect,
  imageWidth: number,
  imageHeight: number
): CropRect | null {
  const clamped = clampCropRect(rect, imageWidth, imageHeight);
  if (isFullImageCrop(clamped, imageWidth, imageHeight)) {
    return null;
  }
  return clamped;
}

/**
 * 書き出し用ソース矩形。未指定・null は画像全体
 *
 * @param imageWidth - 元画像幅
 * @param imageHeight - 元画像高さ
 * @param cropRect - 適用済み crop
 */
export function resolveExportSourceRect(
  imageWidth: number,
  imageHeight: number,
  cropRect: CropRect | null | undefined
): CropRect {
  if (!cropRect) {
    return createFullImageCropRect(imageWidth, imageHeight);
  }
  return clampCropRect(cropRect, imageWidth, imageHeight);
}

/**
 * cropRect の値等価（null 同士は等しい）
 *
 * @param a - 比較対象 A
 * @param b - 比較対象 B
 */
export function areCropRectsEqual(a: CropRect | null, b: CropRect | null): boolean {
  if (a === null && b === null) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
