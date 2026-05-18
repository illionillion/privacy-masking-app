import { STAMP_FILE_NAMES } from "@/features/editor/constants";
import { createEditorSnapshotFromDetections } from "@/features/editor/lib/editorSnapshot";
import type { EditorStateSnapshot } from "@/features/editor/types";
import type { MaskingImageItem } from "../types";
import { getImageEditorSnapshot, setImageEditorSnapshot } from "./imageEditorCache";

const DEFAULT_STAMP_FILE_NAME = STAMP_FILE_NAMES[0] ?? "";

/**
 * 画像のエディタスナップショットを取得する（未キャッシュなら検出結果から生成して保存）
 *
 * @param image - マスキング画像
 */
export function resolveImageEditorSnapshot(image: MaskingImageItem): EditorStateSnapshot {
  const cached = getImageEditorSnapshot(image.id);
  if (cached) {
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
