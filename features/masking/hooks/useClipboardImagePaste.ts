"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { normalizeUploadFiles } from "@/lib/image/normalizeUploadFiles";
import { isUploadBlockedByModelState } from "../lib/offlineManualEdit";

/** useClipboardImagePaste のオプション */
export interface UseClipboardImagePasteOptions {
  onUpload: (files: File[]) => void;
  isModelLoading: boolean;
  isModelError: boolean;
  /** オフライン手動編集モードではモデル状態でブロックしない */
  isOffline: boolean;
}

/**
 * ページ全体の paste イベントをリッスンし、クリップボードの画像を onUpload へ渡す
 *
 * - モデル未ロード・エラー時は何もしない（オフライン時は除く）
 * - クリップボードに画像がない場合も何もしない
 * - ImageUpload と同じ基準（JPEG/PNG/WebP/GIF/HEIC・20MB以下）でバリデーションを行う
 * - 貼り付け成功時にトースト通知を表示する
 *
 * @param options - アップロードコールバックとモデル状態
 */
export function useClipboardImagePaste(options: UseClipboardImagePasteOptions): void {
  const { onUpload, isModelLoading, isModelError, isOffline } = options;

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (isUploadBlockedByModelState(isOffline, isModelLoading, isModelError)) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      const candidateFiles: File[] = [];

      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) candidateFiles.push(file);
      }

      if (candidateFiles.length === 0) return;

      const result = await normalizeUploadFiles(candidateFiles);
      if (result.ok) {
        toast.info("画像を貼り付けました");
        void onUpload(result.files);
        return;
      }

      toast.error(result.error);
    };

    const listener = (e: ClipboardEvent) => {
      void handlePaste(e);
    };

    window.addEventListener("paste", listener);
    return () => {
      window.removeEventListener("paste", listener);
    };
  }, [onUpload, isOffline, isModelLoading, isModelError]);
}
