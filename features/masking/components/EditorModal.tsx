"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditorToolbar } from "@/features/editor/components/EditorToolbar";
import { STAMP_CATALOG, STAMP_FILE_NAMES } from "@/features/editor/constants";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import { exportEditorCanvas } from "@/features/editor/utils/exportCanvas";
import { getOrCreateEditorSnapshot } from "../lib/getOrCreateEditorSnapshot";
import { setImageEditorSnapshot } from "../lib/imageEditorCache";
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
  const selectedStampRegion = editor.stampRegions.find((region) => region.id === editor.selectedId);
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

  /** ESC で閉じる */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

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
    editor.restoreSnapshot(snapshot);
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.id, image.isProcessing, image.detections, image.ocrRegions]);

  /** 編集内容をキャッシュへ反映（初期 restore 後のみ） */
  useEffect(() => {
    if (!hydratedRef.current || image.isProcessing || image.processingError) return;
    setImageEditorSnapshot(image.id, editor.getSnapshot());
  }, [
    image.id,
    image.isProcessing,
    image.processingError,
    editor.stampRegions,
    editor.paintStrokes,
    editor.mode,
    editor.selectedId,
    editor.selectedStampType,
    editor.selectedStampFileName,
    editor.brushSize,
  ]);

  /** エディタ状態に応じてマスク画像をエクスポート */
  useEffect(() => {
    if (!imageElement || image.isProcessing || image.processingError) return;
    let cancelled = false;

    void exportEditorCanvas(imageElement, editor.stampRegions, editor.paintStrokes, stampImages)
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
    editor.stampRegions,
    editor.paintStrokes,
    stampImages,
  ]);

  const handleDone = useCallback(() => {
    setImageEditorSnapshot(image.id, editor.getSnapshot());
    onClose();
  }, [editor, image.id, onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-modal-title"
      className="fixed inset-0 z-50 flex flex-col bg-white"
      onKeyDown={handleKeyDownDialog}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <h2 id="editor-modal-title" className="min-w-0 truncate text-sm font-medium text-zinc-800">
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
            mode={editor.mode}
            selectedStampType={editor.selectedStampType}
            brushSize={editor.brushSize}
            selectedId={editor.selectedId}
            isStampSelected={selectedStampRegion !== undefined}
            onChangeMode={editor.onChangeMode}
            onStampTypeChange={editor.setSelectedStampType}
            onStampFileNameChange={editor.setSelectedStampFileName}
            onBrushSizeChange={editor.setBrushSize}
            onDeleteSelected={editor.removeSelectedItem}
            stampCatalog={STAMP_CATALOG}
            selectedStampFileName={editor.selectedStampFileName}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {imageNaturalWidth > 0 && imageNaturalHeight > 0 && (
            <EditorCanvas
              key={image.id}
              imageUrl={image.imageUrl}
              imageNaturalWidth={imageNaturalWidth}
              imageNaturalHeight={imageNaturalHeight}
              stampRegions={editor.stampRegions}
              paintStrokes={editor.paintStrokes}
              selectedId={editor.selectedId}
              mode={editor.mode}
              selectedStampType={editor.selectedStampType}
              brushSize={editor.brushSize}
              onSelectItem={editor.selectItem}
              onAddStampRegion={editor.addStampRegion}
              onAddPaintStroke={editor.addPaintStroke}
              onUpdateStampRegion={editor.updateStampRegion}
              onUpdatePaintStroke={editor.updatePaintStroke}
              stampImages={stampImages}
              selectedStampFileName={editor.selectedStampFileName}
              onDeleteSelected={editor.removeSelectedItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}
