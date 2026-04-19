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
  const [regions, setRegionsState] = useState<MaskRegion[]>([]);

  /**
   * 領域の有効/無効を切り替える
   *
   * @param id - 切り替える領域のID
   */
  const toggleRegion = useCallback((id: string) => {
    setRegionsState((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
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
    setRegionsState((prev) => [...prev, newRegion]);
  }, []);

  /**
   * 複数の領域を一括でセットする（既存領域は置き換え）
   *
   * 検出結果などをまとめて反映する際に使用し、
   * 複数回の addRegion 呼び出しによる余分な再レンダリングを防ぐ。
   *
   * @param newRegions - 設定する領域の配列（id と isEnabled を除く）
   */
  const setRegions = useCallback((newRegions: Omit<MaskRegion, "id" | "isEnabled">[]) => {
    setRegionsState(
      newRegions.map((r) => ({
        ...r,
        id: crypto.randomUUID(),
        isEnabled: true,
      }))
    );
  }, []);

  /**
   * 指定IDの領域を削除する
   *
   * @param id - 削除する領域のID
   */
  const removeRegion = useCallback((id: string) => {
    setRegionsState((prev) => prev.filter((r) => r.id !== id));
  }, []);

  /**
   * すべての領域をリセットする
   */
  const resetRegions = useCallback(() => {
    setRegionsState([]);
  }, []);

  return {
    regions,
    toggleRegion,
    addRegion,
    setRegions,
    removeRegion,
    resetRegions,
  };
}
