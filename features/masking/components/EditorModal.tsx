"use client";

import dynamic from "next/dynamic";
import { EditorToolbar } from "@/features/editor/components/EditorToolbar";
import { STAMP_CATALOG } from "@/features/editor/constants";
import {
  hasTransparentBackground,
  resolveBackgroundColor,
  resolveTextColor,
} from "@/features/editor/lib/fillText";
import { useEditorModal } from "../hooks/useEditorModal";
import type { MaskingImageItem } from "../types";
import { EditorCanvasPlaceholder } from "./EditorCanvasPlaceholder";

/** Konva は window を module ロード時に参照するため SSR を無効化して動的インポートする */
const EditorCanvas = dynamic(
  () => import("@/features/editor/components/EditorCanvas").then((mod) => mod.EditorCanvas),
  {
    ssr: false,
    loading: () => <EditorCanvasPlaceholder className="min-h-0 flex-1" />,
  }
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
  const {
    editor,
    saveAndCloseModal,
    requestCancelModal,
    isClosing,
    dialogRef,
    doneButtonRef,
    imageNaturalWidth,
    imageNaturalHeight,
    handleKeyDownDialog,
  } = useEditorModal({ image, stampImages, onClose, onRendered });

  const selectedStampRegion = editor.stampRegions.find((region) => region.id === editor.selectedId);
  const selectedTextRegion =
    selectedStampRegion?.stampType === "fill-text" ? selectedStampRegion : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3"
      onKeyDown={handleKeyDownDialog}
    >
      <div
        role="presentation"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={() => {
          if (!isClosing) requestCancelModal();
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
        className="relative z-10 flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[calc(100dvh-1.5rem)]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-3 py-2 sm:px-4 sm:py-2.5">
          <h2
            id="editor-modal-title"
            className="min-w-0 truncate text-sm font-medium text-zinc-800"
          >
            {image.name}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={requestCancelModal}
              disabled={isClosing}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              ref={doneButtonRef}
              type="button"
              onClick={saveAndCloseModal}
              disabled={isClosing}
              className="rounded-lg bg-zinc-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              完了
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-zinc-200 p-1.5 sm:p-2">
            <EditorToolbar
              mode={editor.mode}
              selectedStampType={editor.selectedStampType}
              selectedPaintType={editor.selectedPaintType}
              brushSize={editor.brushSize}
              selectedId={editor.selectedId}
              isStampSelected={selectedStampRegion !== undefined}
              onChangeMode={editor.onChangeMode}
              onStampTypeChange={editor.setSelectedStampType}
              onPaintTypeChange={editor.setSelectedPaintType}
              onStampFileNameChange={editor.setSelectedStampFileName}
              onBrushSizeChange={editor.setBrushSize}
              onDeleteSelected={editor.removeSelectedItem}
              stampCatalog={STAMP_CATALOG}
              selectedStampFileName={editor.selectedStampFileName}
              onRestoreCrop={editor.restoreCrop}
              canRestoreCrop={editor.cropRect !== null}
              isTextSelected={selectedTextRegion !== undefined}
              overlayText={selectedTextRegion?.overlayText ?? ""}
              textColor={selectedTextRegion ? resolveTextColor(selectedTextRegion) : undefined}
              backgroundColor={
                selectedTextRegion ? resolveBackgroundColor(selectedTextRegion) : undefined
              }
              onOverlayTextChange={(text) => {
                if (selectedTextRegion) {
                  editor.updateStampRegion(selectedTextRegion.id, { overlayText: text });
                }
              }}
              onTextColorChange={(color) => {
                if (selectedTextRegion) {
                  editor.updateStampRegion(selectedTextRegion.id, { textColor: color });
                }
              }}
              onBackgroundColorChange={(color) => {
                if (selectedTextRegion) {
                  editor.updateStampRegion(selectedTextRegion.id, { backgroundColor: color });
                }
              }}
              isBackgroundTransparent={
                selectedTextRegion ? hasTransparentBackground(selectedTextRegion) : false
              }
              onBackgroundTransparentChange={(transparent) => {
                if (selectedTextRegion) {
                  editor.updateStampRegion(selectedTextRegion.id, {
                    isBackgroundTransparent: transparent,
                  });
                }
              }}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1.5 sm:p-2">
            {imageNaturalWidth > 0 && imageNaturalHeight > 0 ? (
              <EditorCanvas
                key={image.id}
                pinViewportControls
                className="min-h-0 flex-1"
                imageUrl={image.imageUrl}
                imageNaturalWidth={imageNaturalWidth}
                imageNaturalHeight={imageNaturalHeight}
                stampRegions={editor.stampRegions}
                paintStrokes={editor.paintStrokes}
                selectedId={editor.selectedId}
                mode={editor.mode}
                selectedStampType={editor.selectedStampType}
                selectedPaintType={editor.selectedPaintType}
                brushSize={editor.brushSize}
                onSelectItem={editor.selectItem}
                onAddStampRegion={editor.addStampRegion}
                onAddPaintStroke={editor.addPaintStroke}
                onUpdateStampRegion={editor.updateStampRegion}
                onUpdatePaintStroke={editor.updatePaintStroke}
                stampImages={stampImages}
                selectedStampFileName={editor.selectedStampFileName}
                onDeleteSelected={editor.removeSelectedItem}
                cropRect={editor.cropRect}
                onUpdateCropRect={(rect) =>
                  editor.updateCropRect(rect, {
                    width: imageNaturalWidth,
                    height: imageNaturalHeight,
                  })
                }
              />
            ) : (
              <EditorCanvasPlaceholder className="min-h-0 flex-1" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
