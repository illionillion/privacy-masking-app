import { STAMP_FILE_NAMES } from "@/features/editor/constants";
import { createEditorSnapshotFromDetections } from "@/features/editor/lib/editorSnapshot";
import type { EditorStateSnapshot } from "@/features/editor/types";
import type { DetectedFace, DetectedTextRegion } from "../types";
import { getImageEditorSnapshot, setImageEditorSnapshot } from "./imageEditorCache";

const DEFAULT_STAMP_FILE_NAME = STAMP_FILE_NAMES[0] ?? "";

/** スナップショット生成に必要な画像フィールド（maskedBlobUrl 等の更新で effect が再実行されないよう分離） */
export interface EditorSnapshotInput {
  id: string;
  detections: DetectedFace[];
  ocrRegions: DetectedTextRegion[];
}

/**
 * キャッシュが検出結果と整合しているか（空キャッシュの誤復元を防ぐ）
 *
 * @param input - 検出結果を含む画像フィールド
 * @param snapshot - 検証対象のスナップショット
 */
export function isEditorSnapshotUsable(
  input: EditorSnapshotInput,
  snapshot: EditorStateSnapshot
): boolean {
  const expectedFromDetection = input.detections.length + input.ocrRegions.length;
  if (expectedFromDetection === 0) {
    return true;
  }
  return snapshot.stampRegions.length > 0;
}

/**
 * 画像のエディタスナップショットを取得する（無効なキャッシュは検出結果から再生成）
 *
 * @param input - 検出結果を含む画像フィールド
 */
export function getOrCreateEditorSnapshot(input: EditorSnapshotInput): EditorStateSnapshot {
  const cached = getImageEditorSnapshot(input.id);
  if (cached && isEditorSnapshotUsable(input, cached)) {
    return cached;
  }
  const snapshot = createEditorSnapshotFromDetections(
    input.detections,
    input.ocrRegions,
    DEFAULT_STAMP_FILE_NAME
  );
  setImageEditorSnapshot(input.id, snapshot);
  return snapshot;
}
