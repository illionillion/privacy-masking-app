"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditorToolbar } from "@/features/editor/components/EditorToolbar";
import { STAMP_CATALOG, STAMP_FILE_NAMES } from "@/features/editor/constants";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import { exportEditorCanvas } from "@/features/editor/utils/exportCanvas";
import { getOrCreateEditorSnapshot } from "../lib/getOrCreateEditorSnapshot";
import { persistImageEditorSnapshot, setImageEditorSnapshot } from "../lib/imageEditorCache";
import type { MaskingImageItem } from "../types";

/** Konva は window を module ロード時に参照するため SSR を無効化して動的インポートする */
const EditorCanvas = dynamic(
  () => import("@/features/editor/components/EditorCanvas").then((mod) => mod.EditorCanvas),
  { ssr: false }
);

interface EditorModalProps {
  image: MaskingImageItem;
  stampImages: Map<string, HTMLImageElement>;
  onClose: () => void;
  onRendered: (id: string, blobUrl: string) => void;
}

/**
 * 画像編集用フルスクリーンモーダル
 *
 * 1 枚の Konva キャンバスとツールバーを表示する。閉じてもスナップショットはキャッシュに残す。
 */
export function EditorModal({ image, stampImages, onClose, onRendered }: EditorModalProps) {
  const editor = useEditorState(STAMP_FILE_NAMES[0] ?? "");
  const {
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
    restoreSnapshot,
    getSnapshot,
    addStampRegion,
    addPaintStroke,
    updateStampRegion,
    updatePaintStroke,
    removeSelectedItem,
  } = editor;
  const selectedStampRegion = stampRegions.find((region) => region.id === selectedId);
  const dialogRef = useRef<HTMLDivElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
  const onRenderedRef = useRef(onRendered);
  /** 初期 restore 完了前はキャッシュ同期しない（空 state でキャッシュを汚染しない） */
  const hydratedRef = useRef(false);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  useEffect(() => {
    hydratedRef.current = false;
  }, [image.id]);

  /** 閉じるときは選択状態をキャッシュに残さない（完了・ESC・オーバーレイ共通） */
  const closeModal = useCallback(() => {
    persistImageEditorSnapshot(image.id, getSnapshot());
    onClose();
  }, [getSnapshot, image.id, onClose]);

  /** モーダル表示時のスクロールロックとフォーカス */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevFocusedElement = document.activeElement as HTMLElement | null;
    doneButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocusedElement?.focus();
    };
  }, []);

  /**
   * ESC: 選択中なら選択解除を優先、未選択ならモーダルを閉じる
   *
   * EditorCanvas 側にも Escape ハンドラがあるが、document で先に処理する。
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedId !== null) {
        selectItem(null);
        e.preventDefault();
        return;
      }
      closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, selectItem, closeModal]);

  /** Tab フォーカストラップ */
  const handleKeyDownDialog = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  /** 画像読み込み */
  useEffect(() => {
    if (!image.imageUrl) return;
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageNaturalWidth(img.naturalWidth);
      setImageNaturalHeight(img.naturalHeight);
    };
    img.src = image.imageUrl;
  }, [image.imageUrl]);

  /**
   * モーダル表示時: 検出結果付きスナップショットを同期的に restore（paint 前に反映）
   */
  useLayoutEffect(() => {
    if (image.isProcessing) return;
    const snapshot = getOrCreateEditorSnapshot(image);
    restoreSnapshot({ ...snapshot, selectedId: null });
    hydratedRef.current = true;
    // image 全体は maskedBlobUrl 更新で参照が変わるため、検出結果のフィールドのみ依存に含める
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getOrCreateEditorSnapshot(image)
  }, [image.id, image.isProcessing, image.detections, image.ocrRegions, restoreSnapshot]);

  /** 編集内容をキャッシュへ反映（初期 restore 後のみ） */
  useEffect(() => {
    if (!hydratedRef.current || image.isProcessing || image.processingError) return;
    setImageEditorSnapshot(image.id, getSnapshot());
  }, [image.id, image.isProcessing, image.processingError, getSnapshot]);

  /** エディタ状態に応じてマスク画像をエクスポート */
  useEffect(() => {
    if (!imageElement || image.isProcessing || image.processingError) return;
    let cancelled = false;

    void exportEditorCanvas(imageElement, stampRegions, paintStrokes, stampImages)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        onRenderedRef.current(image.id, blobUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error("エクスポートに失敗しました", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    imageElement,
    image.id,
    image.isProcessing,
    image.processingError,
    stampRegions,
    paintStrokes,
    stampImages,
  ]);

  const handleDone = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      onKeyDown={handleKeyDownDialog}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50"
        aria-label="編集を閉じる"
        onClick={closeModal}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
        className="relative z-10 flex max-h-[min(90dvh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <h2
            id="editor-modal-title"
            className="min-w-0 truncate text-sm font-medium text-zinc-800"
          >
            {image.name}
          </h2>
          <button
            ref={doneButtonRef}
            type="button"
            onClick={handleDone}
            className="shrink-0 rounded-lg bg-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            完了
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-zinc-200 p-2">
            <EditorToolbar
              mode={mode}
              selectedStampType={selectedStampType}
              brushSize={brushSize}
              selectedId={selectedId}
              isStampSelected={selectedStampRegion !== undefined}
              onChangeMode={onChangeMode}
              onStampTypeChange={setSelectedStampType}
              onStampFileNameChange={setSelectedStampFileName}
              onBrushSizeChange={setBrushSize}
              onDeleteSelected={removeSelectedItem}
              stampCatalog={STAMP_CATALOG}
              selectedStampFileName={selectedStampFileName}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2">
            {imageNaturalWidth > 0 && imageNaturalHeight > 0 && (
              <EditorCanvas
                key={image.id}
                imageUrl={image.imageUrl}
                imageNaturalWidth={imageNaturalWidth}
                imageNaturalHeight={imageNaturalHeight}
                stampRegions={stampRegions}
                paintStrokes={paintStrokes}
                selectedId={selectedId}
                mode={mode}
                selectedStampType={selectedStampType}
                brushSize={brushSize}
                onSelectItem={selectItem}
                onAddStampRegion={addStampRegion}
                onAddPaintStroke={addPaintStroke}
                onUpdateStampRegion={updateStampRegion}
                onUpdatePaintStroke={updatePaintStroke}
                stampImages={stampImages}
                selectedStampFileName={selectedStampFileName}
                onDeleteSelected={removeSelectedItem}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
