"use client";

import { useState, useCallback } from "react";
import type { MaskRegion, UseEditorReturn } from "../types";

/**
 * エディターフック
 *
 * マスキング対象領域の管理（追加・削除・有効/無効の切り替え）を提供する。
 * 将来的な編集UI（手動追加・削除・ON/OFF切替）の受け口となる。
 *
 * @returns {UseEditorReturn} 領域管理の状態と操作関数
 */
export function useEditor(): UseEditorReturn {
  const [regions, setRegions] = useState<MaskRegion[]>([]);

  /**
   * 領域の有効/無効を切り替える
   *
   * @param id - 切り替える領域のID
   */
  const toggleRegion = useCallback((id: string) => {
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)));
  }, []);

  /**
   * 新しいマスキング領域を追加する
   *
   * @param region - 追加する領域（id と isEnabled を除く）
   */
  const addRegion = useCallback((region: Omit<MaskRegion, "id" | "isEnabled">) => {
    const newRegion: MaskRegion = {
      ...region,
      id: crypto.randomUUID(),
      isEnabled: true,
    };
    setRegions((prev) => [...prev, newRegion]);
  }, []);

  /**
   * 指定IDの領域を削除する
   *
   * @param id - 削除する領域のID
   */
  const removeRegion = useCallback((id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /**
   * すべての領域をリセットする
   */
  const resetRegions = useCallback(() => {
    setRegions([]);
  }, []);

  return { regions, toggleRegion, addRegion, removeRegion, resetRegions };
}
