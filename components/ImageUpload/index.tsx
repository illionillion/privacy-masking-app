"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import clsx from "clsx";
import { ImageIcon, LoaderCircle } from "lucide-react";

/** 許可するファイル形式 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 最大ファイルサイズ (20MB) */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface ImageUploadProps {
  /** ファイル選択時のコールバック */
  onUpload: (files: File[]) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** 複数選択を許可するか */
  multiple?: boolean;
  /** ローディング表示メッセージ */
  loadingMessage?: string | null;
}

/**
 * 画像アップロードコンポーネント
 *
 * ドラッグ＆ドロップとファイル選択の両方に対応。
 * 許可形式: JPEG / PNG / WebP / GIF（最大20MB）
 */
export function ImageUpload({
  onUpload,
  disabled = false,
  multiple = true,
  loadingMessage = null,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル配列のバリデーションを行い、問題ないファイルのみコールバックを呼ぶ
   *
   * @param files - アップロード対象ファイル配列
   */
  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];
      let validationError: string | null = null;

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          validationError = "JPEG / PNG / WebP / GIF 形式の画像を選択してください";
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          validationError = "ファイルサイズは20MB以下にしてください";
          continue;
        }
        validFiles.push(file);
      }

      setError(validationError);
      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      handleFiles(multiple ? files : [files[0]]);
    },
    [disabled, handleFiles, multiple]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    /** relatedTarget がドロップゾーン内の Node の場合のみハイライトを維持する */
    const container = e.currentTarget;
    const relatedTarget = e.relatedTarget;
    if (relatedTarget instanceof Node && container.contains(relatedTarget)) return;
    setIsDragOver(false);
  }, []);

  const handleDesktopKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) inputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (files.length > 0) {
        handleFiles(multiple ? files : [files[0]]);
      }
      // 同じファイルを連続で選択できるよう、入力値をリセットする
      e.target.value = "";
    },
    [handleFiles, multiple]
  );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-label="画像をアップロード。クリックしてファイルを選択"
        aria-busy={Boolean(loadingMessage)}
        disabled={disabled}
        className={clsx([
          "w-full md:hidden",
          "inline-flex items-center justify-center gap-2",
          "rounded-xl px-4 py-3 text-sm font-semibold",
          "transition-colors duration-200",
          "bg-blue-600 text-white hover:bg-blue-700",
          disabled && "cursor-not-allowed opacity-50",
        ])}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {loadingMessage ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{loadingMessage}</span>
          </>
        ) : (
          <>
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            <span>{multiple ? "画像を選択" : "画像を選ぶ"}</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-500 md:hidden">
        JPEG / PNG / WebP / GIF（最大 20MB）
      </p>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="画像をアップロード。クリックまたはドラッグ＆ドロップ"
        aria-disabled={disabled}
        aria-busy={Boolean(loadingMessage)}
        className={clsx([
          "hidden w-full md:flex",
          "cursor-pointer flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed px-6 py-12 text-center",
          "transition-colors duration-200",
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100",
          disabled && "cursor-not-allowed opacity-50",
        ])}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleDesktopKeyDown}
      >
        {loadingMessage ? (
          <div className="flex flex-col items-center gap-2">
            <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />
            <p className="text-sm font-medium text-blue-700">{loadingMessage}</p>
          </div>
        ) : (
          <>
            <ImageIcon className="h-10 w-10 text-zinc-500" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-zinc-700">画像をドラッグ＆ドロップ</p>
              <p className="text-sm text-zinc-500">
                または クリックして{multiple ? "ファイルを複数選択" : "ファイルを選択"}
              </p>
              <p className="text-xs text-zinc-400">JPEG / PNG / WebP / GIF（最大 20MB）</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
        aria-hidden="true"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
