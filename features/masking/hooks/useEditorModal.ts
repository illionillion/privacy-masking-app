"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { STAMP_FILE_NAMES } from "@/features/editor/constants";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import type { UseEditorStateReturn } from "@/features/editor/hooks/useEditorState";
import type { EditorStateSnapshot } from "@/features/editor/types";
import { exportEditorCanvas } from "@/features/editor/utils/exportCanvas";
import { useConfirmStore } from "@/lib/confirmStore";
import { hasEditorContentChanges } from "../lib/editorSnapshotDirty";
import { getOrCreateEditorSnapshot } from "../lib/getOrCreateEditorSnapshot";
import { persistImageEditorSnapshot, setImageEditorSnapshot } from "../lib/imageEditorCache";
import type { MaskingImageItem } from "../types";

interface UseEditorModalParams {
  image: MaskingImageItem;
  stampImages: Map<string, HTMLImageElement>;
  onClose: () => void;
  onRendered: (id: string, blobUrl: string) => void;
}

interface UseEditorModalReturn {
  editor: UseEditorStateReturn;
  saveAndCloseModal: () => void;
  requestCancelModal: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
  doneButtonRef: RefObject<HTMLButtonElement | null>;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  handleKeyDownDialog: (e: KeyboardEvent<HTMLDivElement>) => void;
}

const CANCEL_CONFIRM_MESSAGE = "編集内容は保存されません。キャンセルしますか？";

/**
 * 編集モーダルのエディタ state・キャッシュ・エクスポート・キーボード操作をまとめる
 */
export function useEditorModal({
  image,
  stampImages,
  onClose,
  onRendered,
}: UseEditorModalParams): UseEditorModalReturn {
  const editor = useEditorState(STAMP_FILE_NAMES[0] ?? "");
  const { selectedId, selectItem, restoreSnapshot, getSnapshot, stampRegions, paintStrokes } =
    editor;

  const dialogRef = useRef<HTMLDivElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
  const onRenderedRef = useRef(onRendered);
  const hydratedRef = useRef(false);
  const baselineSnapshotRef = useRef<EditorStateSnapshot | null>(null);

  const saveAndCloseModal = useCallback(() => {
    persistImageEditorSnapshot(image.id, getSnapshot());
    onClose();
  }, [getSnapshot, image.id, onClose]);

  const requestCancelModal = useCallback(() => {
    const baseline = baselineSnapshotRef.current;
    if (!baseline) {
      onClose();
      return;
    }

    void (async () => {
      const current = getSnapshot();
      if (hasEditorContentChanges(current, baseline)) {
        const confirmed = await useConfirmStore.getState().open(CANCEL_CONFIRM_MESSAGE);
        if (!confirmed) return;
      }

      persistImageEditorSnapshot(image.id, baseline);

      if (imageElement && !image.isProcessing && !image.processingError) {
        try {
          const blobUrl = await exportEditorCanvas(
            imageElement,
            baseline.stampRegions,
            baseline.paintStrokes,
            stampImages
          );
          onRenderedRef.current(image.id, blobUrl);
        } catch (err: unknown) {
          console.error("キャンセル時のプレビュー復元に失敗しました", err);
        }
      }

      onClose();
    })();
  }, [
    getSnapshot,
    image.id,
    image.isProcessing,
    image.processingError,
    imageElement,
    stampImages,
    onClose,
  ]);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  useEffect(() => {
    hydratedRef.current = false;
  }, [image.id]);

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

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedId !== null) {
        selectItem(null);
        e.preventDefault();
        return;
      }
      requestCancelModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, selectItem, requestCancelModal]);

  const handleKeyDownDialog = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
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

  useLayoutEffect(() => {
    if (image.isProcessing) return;
    const snapshot = getOrCreateEditorSnapshot({
      id: image.id,
      detections: image.detections,
      ocrRegions: image.ocrRegions,
    });
    const opened = { ...snapshot, selectedId: null };
    restoreSnapshot(opened);
    baselineSnapshotRef.current = opened;
    hydratedRef.current = true;
  }, [image.id, image.isProcessing, image.detections, image.ocrRegions, restoreSnapshot]);

  useEffect(() => {
    if (!hydratedRef.current || image.isProcessing || image.processingError) return;
    setImageEditorSnapshot(image.id, getSnapshot());
  }, [image.id, image.isProcessing, image.processingError, getSnapshot]);

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
        if (!cancelled) console.error("エクスポートに失敗しました", err);
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

  return {
    editor,
    saveAndCloseModal,
    requestCancelModal,
    dialogRef,
    doneButtonRef,
    imageNaturalWidth,
    imageNaturalHeight,
    handleKeyDownDialog,
  };
}
