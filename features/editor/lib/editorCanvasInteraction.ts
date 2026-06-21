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
  if (mode === "select") {
    return true;
  }
  if (mode === "rect") {
    return stampRegions.some((region) => region.id === selectedId);
  }
  return false;
}
