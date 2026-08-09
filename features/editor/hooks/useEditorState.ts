"use client";

import { useState, useCallback } from "react";
import { STAMP_FILE_NAMES } from "../constants";
import { normalizeAppliedCropRect } from "../lib/cropRect";
import { createEditorSnapshotFromDetections } from "../lib/editorSnapshot";
import { generateUUID } from "../lib/generateUUID";
import { resolveStampFileName } from "../lib/pickStampImage";
import type {
  CropRect,
  EditorMode,
  EditorStateSnapshot,
  PaintStroke,
  StampRegion,
  StampType,
} from "../types";

/** crop 正規化時に渡す画像サイズ */
export interface EditorImageSize {
  width: number;
  height: number;
}

/** useEditorState フックの戻り値型 */
export interface UseEditorStateReturn {
  mode: EditorMode;
  stampRegions: StampRegion[];
  paintStrokes: PaintStroke[];
  selectedId: string | null;
  selectedStampType: StampType;
  selectedStampFileName: string;
  brushSize: number;
  /** 仮想 crop。フル画像は null */
  cropRect: CropRect | null;
  onChangeMode: (mode: EditorMode) => void;
  updateCropRect: (rect: CropRect, imageSize: EditorImageSize) => void;
  restoreCrop: () => void;
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
  restoreSnapshot: (snapshot: EditorStateSnapshot) => void;
  getSnapshot: () => EditorStateSnapshot;
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
  const [cropRect, setCropRect] = useState<CropRect | null>(null);

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
      if (stampRegion.stampType !== "stamp-face") return;

      const fileName = resolveStampFileName(stampRegion, STAMP_FILE_NAMES);
      if (!fileName) return;
      _setSelectedStampFileName(fileName);
      /** 旧スナップショット等で stampFileName 未設定の領域は、表示と揃えてバックフィルする */
      if (!stampRegion.stampFileName) {
        setStampRegions((prev) =>
          prev.map((region) => (region.id === id ? { ...region, stampFileName: fileName } : region))
        );
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
  const restoreSnapshot = useCallback((snapshot: EditorStateSnapshot) => {
    setMode(snapshot.mode === "crop" ? "select" : snapshot.mode);
    setStampRegions(snapshot.stampRegions);
    setPaintStrokes(snapshot.paintStrokes);
    setSelectedId(snapshot.selectedId);
    _setSelectedStampType(snapshot.selectedStampType);
    _setSelectedStampFileName(snapshot.selectedStampFileName);
    setBrushSize(snapshot.brushSize);
    setCropRect(snapshot.cropRect ?? null);
  }, []);

  const getSnapshot = useCallback(
    (): EditorStateSnapshot => ({
      mode,
      stampRegions,
      paintStrokes,
      selectedId,
      selectedStampType,
      selectedStampFileName,
      brushSize,
      cropRect,
    }),
    [
      mode,
      stampRegions,
      paintStrokes,
      selectedId,
      selectedStampType,
      selectedStampFileName,
      brushSize,
      cropRect,
    ]
  );

  const initFromDetections = useCallback(
    (
      detections: Array<{ x: number; y: number; width: number; height: number }>,
      ocrRegions: Array<{ x: number; y: number; width: number; height: number; text: string }>
    ) => {
      restoreSnapshot(
        createEditorSnapshotFromDetections(detections, ocrRegions, selectedStampFileName)
      );
    },
    [restoreSnapshot, selectedStampFileName]
  );

  /**
   * マスキング領域を追加する
   *
   * 手動追加直後に位置調整できるよう、追加した領域を選択状態にする（モードは変更しない）。
   *
   * @param region - 追加する領域（id を除く）
   */
  const addStampRegion = useCallback((region: Omit<StampRegion, "id">) => {
    const id = generateUUID();
    const newRegion: StampRegion = { ...region, id };
    setStampRegions((prev) => [...prev, newRegion]);
    setSelectedId(id);
    _setSelectedStampType(newRegion.stampType);
    if (newRegion.stampFileName) {
      _setSelectedStampFileName(newRegion.stampFileName);
    }
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

  /**
   * crop をその場で反映する。フル画像なら null にする
   *
   * @param rect - 新しい crop 矩形
   * @param imageSize - 元画像サイズ
   */
  const updateCropRect = useCallback((rect: CropRect, imageSize: EditorImageSize) => {
    setCropRect(normalizeAppliedCropRect(rect, imageSize.width, imageSize.height));
  }, []);

  /**
   * 仮想 crop を解除する
   */
  const restoreCrop = useCallback(() => {
    setCropRect(null);
  }, []);

  return {
    mode,
    stampRegions,
    paintStrokes,
    selectedId,
    selectedStampType,
    selectedStampFileName,
    brushSize,
    cropRect,
    onChangeMode,
    updateCropRect,
    restoreCrop,
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
    restoreSnapshot,
    getSnapshot,
  };
}
