"use client";

import { useCallback, useRef, useState } from "react";
import clsx from "clsx";

/** 許可するファイル形式 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 最大ファイルサイズ (20MB) */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface ImageUploadProps {
  /** ファイル選択時のコールバック */
  onUpload: (file: File) => void;
  /** 無効化フラグ */
  disabled?: boolean;
}

/**
 * 画像アップロードコンポーネント
 *
 * ドラッグ＆ドロップとファイル選択の両方に対応。
 * 許可形式: JPEG / PNG / WebP / GIF（最大20MB）
 */
export function ImageUpload({ onUpload, disabled = false }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイルのバリデーションを行い、問題なければコールバックを呼ぶ
   *
   * @param file - アップロード対象ファイル
   */
  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("JPEG / PNG / WebP / GIF 形式の画像を選択してください");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("ファイルサイズは20MB以下にしてください");
        return;
      }
      onUpload(file);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) inputRef.current?.click();
      }
    },
    [disabled]
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="画像をアップロード。クリックまたはドラッグ＆ドロップ"
        aria-disabled={disabled}
        className={clsx([
          "flex cursor-pointer flex-col items-center justify-center gap-3",
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
        onKeyDown={handleKeyDown}
      >
        <span className="text-4xl" aria-hidden="true">
          🖼️
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-medium text-zinc-700">画像をドラッグ＆ドロップ</p>
          <p className="text-sm text-zinc-500">または クリックしてファイルを選択</p>
          <p className="text-xs text-zinc-400">JPEG / PNG / WebP / GIF（最大 20MB）</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
          aria-hidden="true"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
