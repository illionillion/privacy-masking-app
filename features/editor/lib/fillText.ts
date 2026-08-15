import type { StampRegion } from "../types";

/** fill-text 種別のデフォルト文言 */
export const DEFAULT_OVERLAY_TEXT = "個人情報";

/** fill-text 種別のデフォルト文字色 */
export const DEFAULT_TEXT_COLOR = "#ffffff";

/** fill-text 種別のデフォルト背景色 */
export const DEFAULT_BACKGROUND_COLOR = "#000000";

/** 自動算出するフォントサイズの下限（px） */
export const MIN_FILL_TEXT_FONT_SIZE = 8;

/** 行送りの比率（フォントサイズに対する 1 行の高さ） */
export const FILL_TEXT_LINE_HEIGHT_RATIO = 1.2;

/** 領域高さに対する余白を除いた使用可能割合 */
const HEIGHT_USABLE_RATIO = 0.8;

/** 領域幅に対する余白を除いた使用可能割合 */
const WIDTH_USABLE_RATIO = 0.9;

/** 1 文字あたりの想定横幅（em 単位、日本語・英数字混在の概算） */
const AVG_CHAR_WIDTH_EM = 0.62;

/**
 * fill-text 領域に表示する文言を解決する（未設定・空文字はデフォルトに戻す）
 *
 * @param region - 対象のマスキング領域
 * @returns 表示する文言
 */
export function resolveOverlayText(region: Pick<StampRegion, "overlayText">): string {
  const text = region.overlayText?.trim();
  return text && text.length > 0 ? region.overlayText! : DEFAULT_OVERLAY_TEXT;
}

/**
 * fill-text 領域の文字色を解決する（未設定はデフォルト）
 *
 * @param region - 対象のマスキング領域
 */
export function resolveTextColor(region: Pick<StampRegion, "textColor">): string {
  return region.textColor ?? DEFAULT_TEXT_COLOR;
}

/**
 * fill-text 領域の背景色を解決する（未設定はデフォルト）
 *
 * @param region - 対象のマスキング領域
 */
export function resolveBackgroundColor(region: Pick<StampRegion, "backgroundColor">): string {
  return region.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
}

/**
 * fill-text 領域の背景を透過するか判定する（未設定は塗りつぶす）
 *
 * @param region - 対象のマスキング領域
 */
export function hasTransparentBackground(
  region: Pick<StampRegion, "isBackgroundTransparent">
): boolean {
  return region.isBackgroundTransparent === true;
}

/**
 * 領域サイズと文言から、表示・書き出しで共通のフォントサイズを算出する
 *
 * 注釈用途のため折り返しはせず 1 行で扱い、高さと幅（文字数）の
 * 両制約の小さい方に合わせる。文言を大きく見せたいときは領域を広げる。
 * 表示（Konva）と export（Canvas 2D）で同じ値を使い、見た目を一致させる。
 *
 * @param width - 領域の幅（px）
 * @param height - 領域の高さ（px）
 * @param text - 表示文言
 * @returns フォントサイズ（px）
 */
export function computeFillTextFontSize(width: number, height: number, text: string): number {
  const charCount = Math.max(text.length, 1);
  const byHeight = (height * HEIGHT_USABLE_RATIO) / FILL_TEXT_LINE_HEIGHT_RATIO;
  const byWidth = (width * WIDTH_USABLE_RATIO) / (charCount * AVG_CHAR_WIDTH_EM);
  return Math.max(MIN_FILL_TEXT_FONT_SIZE, Math.min(byHeight, byWidth));
}
