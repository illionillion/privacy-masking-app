/**
 * エディタキャンバス上の「表示のみ」のビュー倍率（論理座標は変えない）
 */

/** 表示パン（ステージ座標系の平行移動量、px）。論理マスク座標は変えない */
export interface ViewPan {
  x: number;
  y: number;
}

/** パン未適用 */
export const DEFAULT_VIEW_PAN: ViewPan = { x: 0, y: 0 };

/** パン移動ボタン 1 回あたりの移動量（px） */
export const VIEW_PAN_NUDGE_PX = 24;

/** 表示ズームの下限・上限・1 ステップ・既定値 */
export const VIEW_ZOOM = {
  min: 0.5,
  max: 3,
  step: 0.1,
  default: 1,
} as const;

/**
 * ビュー倍率を許容範囲に収める
 *
 * @param z - 入力倍率
 * @returns クランプ後の倍率
 */
export function clampViewZoom(z: number): number {
  return Math.min(VIEW_ZOOM.max, Math.max(VIEW_ZOOM.min, z));
}

/**
 * ステップ刻みに丸める（浮動小数誤差の抑制用）
 *
 * @param z - 入力倍率
 * @returns 0.1 刻みに丸めた倍率（その後クランプ）
 */
export function roundViewZoomStep(z: number): number {
  const rounded = Math.round(z * 10) / 10;
  return clampViewZoom(rounded);
}

/**
 * 表示パンをズームとステージサイズから許容範囲に収める（等倍では常に 0）
 *
 * @param pan - パン量（ステージ px）
 * @param stageWidth - ステージ幅
 * @param stageHeight - ステージ高さ
 * @param viewZoom - 表示倍率
 */
export function clampViewPan(
  pan: ViewPan,
  stageWidth: number,
  stageHeight: number,
  viewZoom: number
): ViewPan {
  if (viewZoom === 1) {
    return DEFAULT_VIEW_PAN;
  }
  const maxX = (stageWidth * Math.abs(1 - viewZoom)) / 2;
  const maxY = (stageHeight * Math.abs(1 - viewZoom)) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

/**
 * ステージ座標（ポインタ）を、ズーム前のコンテンツ座標（0…stageWidth / 0…stageHeight）に変換する
 *
 * 表示は「パン → ステージ中心を原点として viewZoom 倍」と Konva の
 * `Group`（外側パン、`x/y`+`offset` で中心ズーム）と同じ射影式を使う。
 *
 * @param stagePos - ステージ上のポインタ座標
 * @param stageWidth - ステージ幅（px）
 * @param stageHeight - ステージ高さ（px）
 * @param viewZoom - 表示倍率（1 = 等倍）
 * @param viewPan - 表示パン（ステージ px、既定は無移動）
 */
export function stagePointerToContentSpace(
  stagePos: { x: number; y: number },
  stageWidth: number,
  stageHeight: number,
  viewZoom: number,
  viewPan: ViewPan = DEFAULT_VIEW_PAN
): { x: number; y: number } {
  const sx = stagePos.x - viewPan.x;
  const sy = stagePos.y - viewPan.y;
  if (viewZoom === 1) {
    return { x: sx, y: sy };
  }
  const cx = stageWidth / 2;
  const cy = stageHeight / 2;
  return {
    x: cx + (sx - cx) / viewZoom,
    y: cy + (sy - cy) / viewZoom,
  };
}
