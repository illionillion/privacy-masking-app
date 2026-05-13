/**
 * エディタキャンバス上の「表示のみ」のビュー倍率（論理座標は変えない）
 */

/** 表示中心（画像自然サイズ座標）。この点がステージ中央に来るよう表示する。 */
export interface ViewCenter {
  x: number;
  y: number;
}

/** 移動ボタン 1 回あたりの基準移動量（ステージ px）。実際は画像座標へ換算する。 */
export const VIEW_CENTER_NUDGE_PX = 24;

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
 * 表示中心の初期値（画像中央）を返す
 *
 * @param imageNaturalWidth - 元画像の幅
 * @param imageNaturalHeight - 元画像の高さ
 */
export function getDefaultViewCenter(
  imageNaturalWidth: number,
  imageNaturalHeight: number
): ViewCenter {
  return {
    x: imageNaturalWidth / 2,
    y: imageNaturalHeight / 2,
  };
}

/**
 * 表示中心を画像内の有効範囲へ収める
 *
 * `viewZoom <= 1` では画像全体が見えるため、常に画像中央へ戻す。
 * `viewZoom > 1` では、表示領域が画像外へはみ出さない範囲で中心をクランプする。
 *
 * @param center - 表示中心（画像自然サイズ座標）
 * @param imageNaturalWidth - 元画像の幅
 * @param imageNaturalHeight - 元画像の高さ
 * @param viewZoom - 表示倍率
 */
export function clampViewCenter(
  center: ViewCenter,
  imageNaturalWidth: number,
  imageNaturalHeight: number,
  viewZoom: number
): ViewCenter {
  const defaultCenter = getDefaultViewCenter(imageNaturalWidth, imageNaturalHeight);
  if (viewZoom <= 1) {
    return defaultCenter;
  }

  const halfVisibleWidth = imageNaturalWidth / (2 * viewZoom);
  const halfVisibleHeight = imageNaturalHeight / (2 * viewZoom);

  return {
    x: Math.min(imageNaturalWidth - halfVisibleWidth, Math.max(halfVisibleWidth, center.x)),
    y: Math.min(imageNaturalHeight - halfVisibleHeight, Math.max(halfVisibleHeight, center.y)),
  };
}

/**
 * ステージ座標（ポインタ）を、ズーム前のコンテンツ座標（0…stageWidth / 0…stageHeight）に変換する
 *
 * 表示は「contentCenter をステージ中央に合わせて viewZoom 倍」と Konva の
 * `Group`（`x/y` をステージ中央、`offsetX/Y` を contentCenter、`scaleX/Y` を viewZoom）
 * と同じ射影式を使う。
 *
 * @param stagePos - ステージ上のポインタ座標
 * @param stageWidth - ステージ幅（px）
 * @param stageHeight - ステージ高さ（px）
 * @param viewZoom - 表示倍率（1 = 等倍）
 * @param contentCenter - コンテンツ座標系での表示中心
 */
export function stagePointerToContentSpace(
  stagePos: { x: number; y: number },
  stageWidth: number,
  stageHeight: number,
  viewZoom: number,
  contentCenter: { x: number; y: number } = {
    x: stageWidth / 2,
    y: stageHeight / 2,
  }
): { x: number; y: number } {
  const stageCenterX = stageWidth / 2;
  const stageCenterY = stageHeight / 2;
  return {
    x: contentCenter.x + (stagePos.x - stageCenterX) / viewZoom,
    y: contentCenter.y + (stagePos.y - stageCenterY) / viewZoom,
  };
}
