"use client";

import { useState, useCallback } from "react";
import type { EditorMode, PaintStroke, StampRegion, StampType } from "../types";

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
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  selectedStampType: StampType;
  selectedStampFileName: string;
  brushSize: number;
  onChangeMode: (mode: EditorMode) => void;
  setSelectedStampType: (type: StampType) => void;
  setSelectedStampFileName: (name: string) => void;
  setBrushSize: (size: number) => void;
  selectItem: (id: string | null) => void;
  initFromDetections: (
    detections: Array<{ x: number; y: number; width: number; height: number }>,
    ocrRegions: Array<{ x: number; y: number; width: number; height: number; text: string }>
  ) => void;
  addStampRegion: (region: Omit<StampRegion, "id">) => void;
  addPaintStroke: (stroke: Omit<PaintStroke, "id">) => void;
  updateStampRegion: (id: string, updates: Partial<Omit<StampRegion, "id">>) => void;
  updatePaintStroke: (id: string, updates: Partial<Omit<PaintStroke, "id">>) => void;
  toggleStampRegion: (id: string) => void;
  removeItem: (id: string) => void;
  removeSelectedItem: () => void;
}

/**
 * エディタの状態管理フック
 *
 * マスキング領域・ペイントストロークの管理とエディタモード・選択状態を提供する。
 *
 * @param initialStampFileName - stamp-face 種別の初期選択ファイル名
 * @returns {UseEditorStateReturn} エディタ状態と操作関数
 */
export function useEditorState(initialStampFileName = ""): UseEditorStateReturn {
  const [mode, setMode] = useState<EditorMode>("select");
  const [stampRegions, setStampRegions] = useState<StampRegion[]>([]);
  const [paintStrokes, setPaintStrokes] = useState<PaintStroke[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedStampType, _setSelectedStampType] = useState<StampType>("stamp-face");
  const [selectedStampFileName, _setSelectedStampFileName] = useState<string>(initialStampFileName);
  const [brushSize, setBrushSize] = useState<number>(20);

  /**
   * 選択アイテムを設定する
   *
   * @param id - 選択するアイテムのID（null で選択解除）
   */
  const selectItem = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return;
      const stampRegion = stampRegions.find((region) => region.id === id);
      if (!stampRegion) return;
      _setSelectedStampType(stampRegion.stampType);
      if (stampRegion.stampFileName) {
        _setSelectedStampFileName(stampRegion.stampFileName);
      }
    },
    [stampRegions]
  );

  /**
   * スタンプ種別の選択を更新し、必要に応じて選択中のマスキング領域にも反映する
   *
   * @param type - 新しく選択されたスタンプ種別
   */
  const setSelectedStampType = useCallback(
    (type: StampType) => {
      _setSelectedStampType(type);
      if (!selectedId) return;
      setStampRegions((prev) =>
        prev.map((region) =>
          region.id === selectedId
            ? {
                ...region,
                stampType: type,
                stampFileName:
                  type === "stamp-face"
                    ? (region.stampFileName ?? selectedStampFileName)
                    : undefined,
              }
            : region
        )
      );
    },
    [selectedId, selectedStampFileName]
  );

  /**
   * stamp-face 用のスタンプ画像ファイル名を更新し、
   * 選択中のマスキング領域にも反映する
   *
   * @param name - 新しく選択されたファイル名
   */
  const setSelectedStampFileName = useCallback(
    (name: string) => {
      _setSelectedStampFileName(name);
      if (!selectedId) return;
      setStampRegions((prev) =>
        prev.map((region) =>
          region.id === selectedId
            ? {
                ...region,
                stampFileName: name,
              }
            : region
        )
      );
    },
    [selectedId]
  );

  /**
   * 顔検出結果とOCR結果からマスキング領域を初期化する
   *
   * @param detections - 顔検出結果の配列
   * @param ocrRegions - OCR検出結果の配列
   */
  const initFromDetections = useCallback(
    (
      detections: Array<{ x: number; y: number; width: number; height: number }>,
      ocrRegions: Array<{ x: number; y: number; width: number; height: number; text: string }>
    ) => {
      const faceRegions: StampRegion[] = detections.map((det) => ({
        id: generateUUID(),
        x: det.x,
        y: det.y,
        width: det.width,
        height: det.height,
        stampType: "stamp-face" as StampType,
        isEnabled: true,
        source: "face-detection" as const,
      }));
      const ocrMaskRegions: StampRegion[] = ocrRegions.map((region) => ({
        id: generateUUID(),
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        stampType: "fill-black" as StampType,
        isEnabled: true,
        source: "ocr" as const,
        text: region.text,
      }));
      setStampRegions([...faceRegions, ...ocrMaskRegions]);
      setSelectedId(null);
    },
    []
  );

  /**
   * マスキング領域を追加する
   *
   * @param region - 追加する領域（id を除く）
   */
  const addStampRegion = useCallback((region: Omit<StampRegion, "id">) => {
    setStampRegions((prev) => [...prev, { ...region, id: generateUUID() }]);
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
   * マスキング領域を更新する
   *
   * @param id - 更新する領域のID
   * @param updates - 更新内容
   */
  const updateStampRegion = useCallback((id: string, updates: Partial<Omit<StampRegion, "id">>) => {
    setStampRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  /**
   * ペイントストロークを更新する
   *
   * @param id - 更新するストロークのID
   * @param updates - 更新内容
   */
  const updatePaintStroke = useCallback((id: string, updates: Partial<Omit<PaintStroke, "id">>) => {
    setPaintStrokes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  /**
   * マスキング領域の有効/無効を切り替える
   *
   * @param id - 切り替える領域のID
   */
  const toggleStampRegion = useCallback((id: string) => {
    setStampRegions((prev) =>
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
    setPaintStrokes((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  /**
   * 現在選択中のアイテムを削除し選択を解除する
   */
  const removeSelectedItem = useCallback(() => {
    if (selectedId === null) return;
    setStampRegions((prev) => prev.filter((r) => r.id !== selectedId));
    setPaintStrokes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const onChangeMode = useCallback(
    (newMode: EditorMode) => {
      setMode(newMode);
      selectItem(null);
    },
    [selectItem]
  );

  return {
    mode,
    stampRegions,
    paintStrokes,
    selectedId,
    selectedStampType,
    selectedStampFileName,
    brushSize,
    onChangeMode,
    setSelectedStampType,
    setSelectedStampFileName,
    setBrushSize,
    selectItem,
    initFromDetections,
    addStampRegion,
    addPaintStroke,
    updateStampRegion,
    updatePaintStroke,
    toggleStampRegion,
    removeItem,
    removeSelectedItem,
  };
}
