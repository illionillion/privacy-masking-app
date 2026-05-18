import type { EditorStateSnapshot } from "@/features/editor/types";

/** 画像 ID ごとのエディタスナップショット（モーダル閉鎖後も保持） */
const cache = new Map<string, EditorStateSnapshot>();

/**
 * キャッシュからスナップショットを取得する
 *
 * @param imageId - 画像 ID
 */
export function getImageEditorSnapshot(imageId: string): EditorStateSnapshot | undefined {
  return cache.get(imageId);
}

/**
 * スナップショットをキャッシュに保存する
 *
 * @param imageId - 画像 ID
 * @param snapshot - 保存するスナップショット
 */
export function setImageEditorSnapshot(imageId: string, snapshot: EditorStateSnapshot): void {
  cache.set(imageId, snapshot);
}

/**
 * 指定画像のキャッシュを削除する（再検出時など）
 *
 * @param imageId - 画像 ID
 */
export function clearImageEditorSnapshot(imageId: string): void {
  cache.delete(imageId);
}

/** 全画像のキャッシュを削除する */
export function clearAllImageEditorSnapshots(): void {
  cache.clear();
}

/** テスト用: キャッシュを空にする */
export function resetImageEditorCacheForTests(): void {
  cache.clear();
}
