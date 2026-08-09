import type { EditorMode, StampRegion } from "../types";

/**
 * Transformer 表示条件を判定する
 *
 * @param mode - エディタモード
 * @param selectedId - 選択中アイテム ID
 * @param stampRegions - スタンプ領域一覧
 */
export function shouldShowEditorTransformer(
  mode: EditorMode,
  selectedId: string | null,
  stampRegions: StampRegion[]
): boolean {
  if (selectedId === null) {
    return false;
  }
  if (mode === "crop" || mode === "paint") {
    return false;
  }
  if (mode === "select") {
    return true;
  }
  if (mode === "rect") {
    return stampRegions.some((region) => region.id === selectedId);
  }
  return false;
}

/**
 * モーダル内 Stage の touch-action を返す。
 * ピン留め時は選択モードだけ縦スクロール（pan-y）を許し、描画・crop はキャンバス操作を取る。
 *
 * @param pinViewportControls - モーダルでビューポート操作を固定するか
 * @param mode - エディタモード
 */
export function getEditorStageTouchAction(
  pinViewportControls: boolean,
  mode: EditorMode
): "none" | "pan-y" {
  if (!pinViewportControls) {
    return "none";
  }
  if (mode === "select") {
    return "pan-y";
  }
  return "none";
}
