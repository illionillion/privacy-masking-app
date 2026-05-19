import type { EditorStateSnapshot } from "@/features/editor/types";

/** 画像 ID ごとのエディタスナップショット（モーダル閉鎖後も保持） */
const cache = new Map<string, EditorStateSnapshot>();

/** 検出同期またはユーザ編集済みの画像 ID（空領域の意図的削除をキャッシュとして保持する） */
const initializedImageIds = new Set<string>();

/**
 * キャッシュからスナップショットを取得する
 *
 * @param imageId - 画像 ID
 */
export function getImageEditorSnapshot(imageId: string): EditorStateSnapshot | undefined {
  return cache.get(imageId);
}

/**
 * 画像のキャッシュが初期化済みか
 *
 * @param imageId - 画像 ID
 */
export function isImageEditorInitialized(imageId: string): boolean {
  return initializedImageIds.has(imageId);
}

/**
 * キャッシュを初期化済みとしてマークする
 *
 * @param imageId - 画像 ID
 */
export function markImageEditorInitialized(imageId: string): void {
  initializedImageIds.add(imageId);
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
 * 編集内容をキャッシュへ同期する（モーダル編集中の随時保存）
 *
 * @param imageId - 画像 ID
 * @param snapshot - 保存するスナップショット
 */
export function syncImageEditorSnapshot(imageId: string, snapshot: EditorStateSnapshot): void {
  setImageEditorSnapshot(imageId, snapshot);
  markImageEditorInitialized(imageId);
}

/**
 * モーダル閉鎖時にキャッシュへ保存する（再オープン時に選択枠が残らないよう selectedId を外す）
 *
 * @param imageId - 画像 ID
 * @param snapshot - 保存するスナップショット
 */
export function persistImageEditorSnapshot(imageId: string, snapshot: EditorStateSnapshot): void {
  setImageEditorSnapshot(imageId, { ...snapshot, selectedId: null });
  markImageEditorInitialized(imageId);
}

/**
 * 指定画像のキャッシュを削除する（再検出時など）
 *
 * @param imageId - 画像 ID
 */
export function clearImageEditorSnapshot(imageId: string): void {
  cache.delete(imageId);
  initializedImageIds.delete(imageId);
}

/** 全画像のキャッシュを削除する */
export function clearAllImageEditorSnapshots(): void {
  cache.clear();
  initializedImageIds.clear();
}

/** テスト用: キャッシュを空にする */
export function resetImageEditorCacheForTests(): void {
  cache.clear();
  initializedImageIds.clear();
}
