import type { EditorStateSnapshot } from "@/features/editor/types";

/**
 * マスキング領域・ペイント・crop のみ比較用に正規化する（選択状態や UI 設定は除外）
 *
 * @param snapshot - 比較対象スナップショット
 */
function contentOnly(
  snapshot: EditorStateSnapshot
): Pick<EditorStateSnapshot, "stampRegions" | "paintStrokes" | "cropRect"> {
  return {
    stampRegions: snapshot.stampRegions,
    paintStrokes: snapshot.paintStrokes,
    cropRect: snapshot.cropRect ?? null,
  };
}

/**
 * ベースラインから編集内容（領域・ストローク）が変わっているか
 *
 * @param current - 現在のスナップショット
 * @param baseline - モーダル表示時のスナップショット
 */
export function hasEditorContentChanges(
  current: EditorStateSnapshot,
  baseline: EditorStateSnapshot
): boolean {
  return JSON.stringify(contentOnly(current)) !== JSON.stringify(contentOnly(baseline));
}
