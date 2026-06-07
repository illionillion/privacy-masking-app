"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from "@/components/ImageUpload/constants";

/** useClipboardImagePaste のオプション */
export interface UseClipboardImagePasteOptions {
  onUpload: (files: File[]) => void;
  isModelLoading: boolean;
  isModelError: boolean;
}

/**
 * ページ全体の paste イベントをリッスンし、クリップボードの画像を onUpload へ渡す
 *
 * - モデル未ロード・エラー時は何もしない
 * - クリップボードに画像がない場合も何もしない
 * - ImageUpload と同じ基準（JPEG/PNG/WebP/GIF・20MB以下）でバリデーションを行う
 * - 貼り付け成功時にトースト通知を表示する
 *
 * @param options - アップロードコールバックとモデル状態
 */
export function useClipboardImagePaste(options: UseClipboardImagePasteOptions): void {
  const { onUpload, isModelLoading, isModelError } = options;

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isModelLoading || isModelError) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const validFiles: File[] = [];
      let validationError: string | null = null;

      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          validationError = "JPEG / PNG / WebP / GIF 形式の画像を選択してください";
          continue;
        }
        if (file.size > MAX_IMAGE_FILE_SIZE) {
          validationError = "ファイルサイズは20MB以下にしてください";
          continue;
        }
        validFiles.push(file);
      }

      /** ImageUpload と同じ挙動: 有効ファイルがあればアップロードのみ、なければエラー表示 */
      if (validFiles.length > 0) {
        toast.info("画像を貼り付けました");
        void onUpload(validFiles);
        return;
      }

      if (validationError) {
        toast.error(validationError);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [onUpload, isModelLoading, isModelError]);
}
