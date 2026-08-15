import type { StampRegion } from "../types";

/** fill-text 種別のデフォルト文言 */
export const DEFAULT_OVERLAY_TEXT = "個人情報";

/** fill-text 種別のデフォルト文字色 */
export const DEFAULT_TEXT_COLOR = "#ffffff";

/** fill-text 種別のデフォルト背景色 */
export const DEFAULT_BACKGROUND_COLOR = "#000000";

/**
 * fill-text の描画フォント
 *
 * Konva（プレビュー）と Canvas 2D（書き出し）で同じ指定を使い、
 * 日本語グリフのフォールバック差による字体・字幅のズレを防ぐ。
 * Konva の既定は Arial のため、必ず両側でこの値を明示する。
 */
export const FILL_TEXT_FONT_FAMILY = "sans-serif";

/** 自動算出するフォントサイズの下限（px） */
export const MIN_FILL_TEXT_FONT_SIZE = 8;

/** 行送りの比率（フォントサイズに対する 1 行の高さ） */
export const FILL_TEXT_LINE_HEIGHT_RATIO = 1.2;

/** 領域高さに対する余白を除いた使用可能割合 */
const HEIGHT_USABLE_RATIO = 0.8;

/** 領域幅に対する余白を除いた使用可能割合 */
const WIDTH_USABLE_RATIO = 0.9;

/**
 * 1 文字あたりの想定横幅（em 単位）
 *
 * 幅の収まりはこの概算のみで担保する（描画時に maxWidth を渡さない）ため、
 * 最も横幅の大きい全角日本語（約 1em）を基準に、はみ出しを防ぐ側へ寄せる。
 * 英数字主体だと実幅より大きめに見積もられ字が小さくなるが、
 * 背景矩形からのはみ出しを避けることを優先する。
 */
const AVG_CHAR_WIDTH_EM = 1.0;

/**
 * fill-text 領域に表示する文言を解決する
 *
 * 入力・state・描画で同じ生値を使うため、ここではデフォルト置換をしない
 * （未設定は空文字を返す）。デフォルト文言は領域の作成・種別変更時にのみ付与する。
 * これにより「キャンバスの表示」と「ツールバーの入力欄」が常に一致し、
 * 文言をクリアしたときもそのまま空として扱える。
 *
 * @param region - 対象のマスキング領域
 * @returns 表示する文言（未設定は空文字）
 */
export function resolveOverlayText(region: Pick<StampRegion, "overlayText">): string {
  return region.overlayText ?? "";
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
