"use client";

import { useState, useCallback } from "react";
import type {
  EditorMode,
  FillRegion,
  PaintStroke,
  RectAddTarget,
  StampRegion,
  StampType,
} from "../types";

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

/** useEditorState フックの戻り値型 */
export interface UseEditorStateReturn {
  mode: EditorMode;
  stampRegions: StampRegion[];
  fillRegions: FillRegion[];
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  selectedStampType: StampType;
  rectTarget: RectAddTarget;
  brushSize: number;
  setMode: (mode: EditorMode) => void;
  setSelectedStampType: (type: StampType) => void;
  setRectTarget: (target: RectAddTarget) => void;
  setBrushSize: (size: number) => void;
  selectItem: (id: string | null) => void;
  initFromDetections: (
    detections: Array<{ x: number; y: number; width: number; height: number }>,
    ocrRegions: Array<{ x: number; y: number; width: number; height: number; text: string }>
  ) => void;
  addStampRegion: (region: Omit<StampRegion, "id">) => void;
  addFillRegion: (region: Omit<FillRegion, "id">) => void;
  addPaintStroke: (stroke: Omit<PaintStroke, "id">) => void;
  updateStampRegion: (id: string, updates: Partial<Omit<StampRegion, "id">>) => void;
  updateFillRegion: (id: string, updates: Partial<Omit<FillRegion, "id">>) => void;
  toggleFillRegion: (id: string) => void;
  removeItem: (id: string) => void;
  removeSelectedItem: () => void;
}

/**
 * エディタの状態管理フック
 *
 * スタンプ領域・塗りつぶし領域・ペイントストロークの管理と
 * エディタモード・選択状態を提供する。
 *
 * @returns {UseEditorStateReturn} エディタ状態と操作関数
 */
export function useEditorState(): UseEditorStateReturn {
  const [mode, setMode] = useState<EditorMode>("select");
  const [stampRegions, setStampRegions] = useState<StampRegion[]>([]);
  const [fillRegions, setFillRegions] = useState<FillRegion[]>([]);
  const [paintStrokes, setPaintStrokes] = useState<PaintStroke[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStampType, setSelectedStampType] = useState<StampType>("stamp-face");
  const [rectTarget, setRectTarget] = useState<RectAddTarget>("fill");
  const [brushSize, setBrushSize] = useState<number>(20);

  /**
   * 選択アイテムを設定する
   *
   * @param id - 選択するアイテムのID（null で選択解除）
   */
  const selectItem = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  /**
   * 顔検出結果とOCR結果からStampRegion/FillRegionを初期化する
   *
   * @param detections - 顔検出結果の配列
   * @param ocrRegions - OCR検出結果の配列
   */
  const initFromDetections = useCallback(
    (
      detections: Array<{ x: number; y: number; width: number; height: number }>,
      ocrRegions: Array<{ x: number; y: number; width: number; height: number; text: string }>
    ) => {
      setStampRegions(
        detections.map((det) => ({
          id: generateUUID(),
          x: det.x,
          y: det.y,
          width: det.width,
          height: det.height,
          stampType: "stamp-face" as StampType,
          isEnabled: true,
          source: "face-detection" as const,
        }))
      );
      setFillRegions(
        ocrRegions.map((region) => ({
          id: generateUUID(),
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          isEnabled: true,
          source: "ocr" as const,
          text: region.text,
        }))
      );
      setSelectedId(null);
    },
    []
  );

  /**
   * スタンプ領域を追加する
   *
   * @param region - 追加する領域（id を除く）
   */
  const addStampRegion = useCallback((region: Omit<StampRegion, "id">) => {
    setStampRegions((prev) => [...prev, { ...region, id: generateUUID() }]);
  }, []);

  /**
   * 塗りつぶし領域を追加する
   *
   * @param region - 追加する領域（id を除く）
   */
  const addFillRegion = useCallback((region: Omit<FillRegion, "id">) => {
    setFillRegions((prev) => [...prev, { ...region, id: generateUUID() }]);
  }, []);

  /**
   * ペイントストロークを追加する
   *
   * @param stroke - 追加するストローク（id を除く）
   */
  const addPaintStroke = useCallback((stroke: Omit<PaintStroke, "id">) => {
    setPaintStrokes((prev) => [...prev, { ...stroke, id: generateUUID() }]);
  }, []);

  /**
   * スタンプ領域を更新する
   *
   * @param id - 更新する領域のID
   * @param updates - 更新内容
   */
  const updateStampRegion = useCallback(
    (id: string, updates: Partial<Omit<StampRegion, "id">>) => {
      setStampRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    },
    []
  );

  /**
   * 塗りつぶし領域を更新する
   *
   * @param id - 更新する領域のID
   * @param updates - 更新内容
   */
  const updateFillRegion = useCallback(
    (id: string, updates: Partial<Omit<FillRegion, "id">>) => {
      setFillRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    },
    []
  );

  /**
   * 塗りつぶし領域の有効/無効を切り替える
   *
   * @param id - 切り替える領域のID
   */
  const toggleFillRegion = useCallback((id: string) => {
    setFillRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
    );
  }, []);

  /**
   * 指定IDのアイテムをいずれかのリストから削除する
   *
   * @param id - 削除するアイテムのID
   */
  const removeItem = useCallback((id: string) => {
    setStampRegions((prev) => prev.filter((r) => r.id !== id));
    setFillRegions((prev) => prev.filter((r) => r.id !== id));
    setPaintStrokes((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  /**
   * 現在選択中のアイテムを削除し選択を解除する
   */
  const removeSelectedItem = useCallback(() => {
    if (selectedId === null) return;
    setStampRegions((prev) => prev.filter((r) => r.id !== selectedId));
    setFillRegions((prev) => prev.filter((r) => r.id !== selectedId));
    setPaintStrokes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  return {
    mode,
    stampRegions,
    fillRegions,
    paintStrokes,
    selectedId,
    selectedStampType,
    rectTarget,
    brushSize,
    setMode,
    setSelectedStampType,
    setRectTarget,
    setBrushSize,
    selectItem,
    initFromDetections,
    addStampRegion,
    addFillRegion,
    addPaintStroke,
    updateStampRegion,
    updateFillRegion,
    toggleFillRegion,
    removeItem,
    removeSelectedItem,
  };
}
