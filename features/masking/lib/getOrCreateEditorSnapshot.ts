import { STAMP_FILE_NAMES } from "@/features/editor/constants";
import { createEditorSnapshotFromDetections } from "@/features/editor/lib/editorSnapshot";
import type { EditorStateSnapshot } from "@/features/editor/types";
import type { MaskingImageItem } from "../types";
import { getImageEditorSnapshot, setImageEditorSnapshot } from "./imageEditorCache";

const DEFAULT_STAMP_FILE_NAME = STAMP_FILE_NAMES[0] ?? "";

/**
 * キャッシュが検出結果と整合しているか（空キャッシュの誤復元を防ぐ）
 *
 * @param image - マスキング画像
 * @param snapshot - 検証対象のスナップショット
 */
export function isEditorSnapshotUsable(
  image: MaskingImageItem,
  snapshot: EditorStateSnapshot
): boolean {
  const expectedFromDetection = image.detections.length + image.ocrRegions.length;
  if (expectedFromDetection === 0) {
    return true;
  }
  return snapshot.stampRegions.length > 0;
}

/**
 * 画像のエディタスナップショットを取得する（無効なキャッシュは検出結果から再生成）
 *
 * @param image - マスキング画像
 */
export function getOrCreateEditorSnapshot(image: MaskingImageItem): EditorStateSnapshot {
  const cached = getImageEditorSnapshot(image.id);
  if (cached && isEditorSnapshotUsable(image, cached)) {
    return cached;
  }
  const snapshot = createEditorSnapshotFromDetections(
    image.detections,
    image.ocrRegions,
    DEFAULT_STAMP_FILE_NAME
  );
  setImageEditorSnapshot(image.id, snapshot);
  return snapshot;
}
