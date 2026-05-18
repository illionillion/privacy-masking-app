import type { EditorStateSnapshot } from "@/features/editor/types";
import type { MaskingImageItem } from "../types";
import { getOrCreateEditorSnapshot } from "./getOrCreateEditorSnapshot";

/**
 * 画像のエディタスナップショットを取得する（未キャッシュなら検出結果から生成して保存）
 *
 * @param image - マスキング画像
 */
export function resolveImageEditorSnapshot(image: MaskingImageItem): EditorStateSnapshot {
  return getOrCreateEditorSnapshot(image);
}
