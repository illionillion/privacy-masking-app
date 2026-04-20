"use client";

import { useState, useCallback } from "react";
import type { MaskRegion, UseMaskingRegionsReturn } from "../types";

/**
 * `crypto.randomUUID` 未対応ブラウザ向けのフォールバックを含むUUID生成関数
 *
 * `crypto.randomUUID` → `crypto.getRandomValues` → `Math.random` の順でフォールバックする。
 */
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  /** `crypto` が完全に未対応の場合は Math.random ベースの UUID v4 */
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * マスキング領域管理フック
 *
 * マスキング対象領域の管理（追加・削除・有効/無効の切り替え）を提供する。
 * 将来的な編集UI（手動追加・削除・ON/OFF切替）の受け口となる。
 *
 * @returns {UseMaskingRegionsReturn} 領域管理の状態と操作関数
 */
export function useMaskingRegions(): UseMaskingRegionsReturn {
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
      id: generateUUID(),
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
        id: generateUUID(),
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
