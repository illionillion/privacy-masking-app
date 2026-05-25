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
import { toast } from "sonner";
import { hasEditorContentChanges } from "../lib/editorSnapshotDirty";
import { getOrCreateEditorSnapshot } from "../lib/getOrCreateEditorSnapshot";
import { persistImageEditorSnapshot } from "../lib/imageEditorCache";
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
  isClosing: boolean;
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
  const { selectedId, selectItem, restoreSnapshot, getSnapshot } = editor;

  const dialogRef = useRef<HTMLDivElement>(null);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [loadedNaturalWidth, setLoadedNaturalWidth] = useState(0);
  const [loadedNaturalHeight, setLoadedNaturalHeight] = useState(0);
  const imageNaturalWidth = image.naturalWidth ?? loadedNaturalWidth;
  const imageNaturalHeight = image.naturalHeight ?? loadedNaturalHeight;
  const onRenderedRef = useRef(onRendered);
  const baselineSnapshotRef = useRef<EditorStateSnapshot | null>(null);
  const closeInFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /** 完了・キャンセルの二重実行を防ぐ */
  const beginCloseAction = useCallback((): boolean => {
    if (closeInFlightRef.current) return false;
    closeInFlightRef.current = true;
    setIsClosing(true);
    return true;
  }, []);

  const abortCloseAction = useCallback(() => {
    closeInFlightRef.current = false;
    setIsClosing(false);
  }, []);

  const saveAndCloseModal = useCallback(() => {
    if (!beginCloseAction()) return;

    void (async () => {
      try {
        const snapshot = getSnapshot();
        persistImageEditorSnapshot(image.id, snapshot);

        if (imageElement && !image.isProcessing && !image.processingError) {
          try {
            const blobUrl = await exportEditorCanvas(
              imageElement,
              snapshot.stampRegions,
              snapshot.paintStrokes,
              stampImages
            );
            if (!isMountedRef.current) {
              URL.revokeObjectURL(blobUrl);
              return;
            }
            onRenderedRef.current(image.id, blobUrl);
          } catch (err: unknown) {
            console.error("完了時のエクスポートに失敗しました", err);
            const detail = err instanceof Error ? err.message : "不明なエラー";
            toast.error(`マスク画像の出力に失敗しました: ${detail}`);
            if (isMountedRef.current) abortCloseAction();
            return;
          }
        }

        if (!isMountedRef.current) return;
        onClose();
      } catch {
        if (isMountedRef.current) abortCloseAction();
      }
    })();
  }, [
    beginCloseAction,
    abortCloseAction,
    getSnapshot,
    image.id,
    image.isProcessing,
    image.processingError,
    imageElement,
    stampImages,
    onClose,
  ]);

  const requestCancelModal = useCallback(() => {
    if (!beginCloseAction()) return;

    const baseline = baselineSnapshotRef.current;
    if (!baseline) {
      onClose();
      return;
    }

    void (async () => {
      try {
        const current = getSnapshot();
        if (hasEditorContentChanges(current, baseline)) {
          const confirmed = await useConfirmStore.getState().open(CANCEL_CONFIRM_MESSAGE);
          if (!isMountedRef.current) return;
          if (!confirmed) {
            abortCloseAction();
            return;
          }
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
            if (!isMountedRef.current) {
              URL.revokeObjectURL(blobUrl);
              return;
            }
            onRenderedRef.current(image.id, blobUrl);
          } catch (err: unknown) {
            console.error("キャンセル時のプレビュー復元に失敗しました", err);
          }
        }

        if (!isMountedRef.current) return;
        onClose();
      } catch {
        if (isMountedRef.current) abortCloseAction();
      }
    })();
  }, [
    beginCloseAction,
    abortCloseAction,
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
      if (closeInFlightRef.current) return;
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
    let cancelled = false;
    const img = new Image();
    const applyLoaded = () => {
      if (cancelled) return;
      setImageElement(img);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setLoadedNaturalWidth(img.naturalWidth);
        setLoadedNaturalHeight(img.naturalHeight);
      }
    };
    img.src = image.imageUrl;
    if (img.complete) {
      applyLoaded();
    } else {
      img.onload = applyLoaded;
    }
    return () => {
      cancelled = true;
    };
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
  }, [image.id, image.isProcessing, image.detections, image.ocrRegions, restoreSnapshot]);

  return {
    editor,
    saveAndCloseModal,
    requestCancelModal,
    isClosing,
    dialogRef,
    doneButtonRef,
    imageNaturalWidth,
    imageNaturalHeight,
    handleKeyDownDialog,
  };
}
