/**
 * エディタキャンバス上の「表示のみ」のビュー倍率（論理座標は変えない）
 */

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
 * ステージ座標（ポインタ）を、ズーム前のコンテンツ座標（0…stageWidth / 0…stageHeight）に変換する
 *
 * 表示はステージ中心を原点として `viewZoom` 倍されている想定。Konva の
 * `Group`（`x/y` と `offset` をステージ中心に、`scaleX/Y` = viewZoom）と同じ射影式を使う。
 *
 * @param stagePos - ステージ上のポインタ座標
 * @param stageWidth - ステージ幅（px）
 * @param stageHeight - ステージ高さ（px）
 * @param viewZoom - 表示倍率（1 = 等倍）
 */
export function stagePointerToContentSpace(
  stagePos: { x: number; y: number },
  stageWidth: number,
  stageHeight: number,
  viewZoom: number
): { x: number; y: number } {
  if (viewZoom === 1) {
    return { x: stagePos.x, y: stagePos.y };
  }
  const cx = stageWidth / 2;
  const cy = stageHeight / 2;
  return {
    x: cx + (stagePos.x - cx) / viewZoom,
    y: cy + (stagePos.y - cy) / viewZoom,
  };
}
