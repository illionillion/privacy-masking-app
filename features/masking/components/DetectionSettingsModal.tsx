"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import type { DetectionPrefs } from "@/lib/preferences";
import {
  closeModalWithUnsavedConfirm,
  hasDetectionSettingsChanges,
} from "../lib/unsavedModalClose";

interface DetectionSettingsModalProps {
  isOpen: boolean;
  settings: DetectionPrefs;
  onClose: () => void;
  onSave: (settings: DetectionPrefs) => void;
}

/**
 * 顔検出・OCR の自動実行を切り替える設定モーダル
 */
export function DetectionSettingsModal({
  isOpen,
  settings,
  onClose,
  onSave,
}: DetectionSettingsModalProps) {
  const [draft, setDraft] = useState<DetectionPrefs>(settings);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const faceId = useId();
  const ocrId = useId();

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      firstFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    void closeModalWithUnsavedConfirm(hasDetectionSettingsChanges(draft, settings), onClose);
  }, [draft, onClose, settings]);

  const handleKeyDownDialog = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        handleCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const onContainer = active === dialogRef.current;

      if (e.shiftKey) {
        if (active === first || onContainer) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || onContainer) {
        e.preventDefault();
        first.focus();
      }
    },
    [handleCancel]
  );

  const handleSave = useCallback(() => {
    onSave(draft);
    onClose();
  }, [draft, onClose, onSave]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onKeyDown={handleKeyDownDialog}
    >
      <div
        role="presentation"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={handleCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-md rounded-xl bg-white px-6 py-5 shadow-xl outline-none"
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-900">
          検出設定
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          アップロード時に自動で走らせる検出を選べます。オフにした分は手動編集ですぐ始められます。
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <label
            htmlFor={faceId}
            className={clsx([
              "flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3",
              "hover:border-zinc-300",
            ])}
          >
            <input
              ref={firstFocusRef}
              id={faceId}
              type="checkbox"
              checked={draft.autoDetectFace}
              onChange={(e) => setDraft((prev) => ({ ...prev, autoDetectFace: e.target.checked }))}
              className="mt-0.5 size-4 shrink-0 rounded border-zinc-300"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-zinc-800">顔を自動検出</span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                オフのときはスタンプや矩形で手動マスクできます
              </span>
            </span>
          </label>

          <label
            htmlFor={ocrId}
            className={clsx([
              "flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-3",
              "hover:border-zinc-300",
            ])}
          >
            <input
              id={ocrId}
              type="checkbox"
              checked={draft.autoDetectOcr}
              onChange={(e) => setDraft((prev) => ({ ...prev, autoDetectOcr: e.target.checked }))}
              className="mt-0.5 size-4 shrink-0 rounded border-zinc-300"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-zinc-800">
                テキストを自動検出（OCR）
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                メール・電話番号など。デスクトップ画面だけ隠すときはオフが速いです
              </span>
            </span>
          </label>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          設定はこのブラウザに保存されます。ギャラリーの「再検出」も同じ設定に従います。
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
