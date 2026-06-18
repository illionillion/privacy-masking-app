"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, Trash2 } from "lucide-react";
import {
  createTermId,
  getCustomMaskTermDedupKey,
  MAX_CUSTOM_MASK_TERM_LENGTH,
  MAX_CUSTOM_MASK_TERMS,
  type CustomMaskTerm,
} from "@/lib/preferences";
import { closeModalWithUnsavedConfirm, hasCustomMaskTermsChanges } from "../lib/unsavedModalClose";

interface CustomMaskTermsModalProps {
  isOpen: boolean;
  terms: CustomMaskTerm[];
  onClose: () => void;
  onSave: (terms: CustomMaskTerm[]) => void;
}

/**
 * ユーザー登録マスク語句を管理するモーダル（Todo リスト形式）
 */
export function CustomMaskTermsModal({
  isOpen,
  terms,
  onClose,
  onSave,
}: CustomMaskTermsModalProps) {
  const [draft, setDraft] = useState<CustomMaskTerm[]>(terms);
  const [newTermText, setNewTermText] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const newTermInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const titleId = useId();
  const newTermId = useId();

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      newTermInputRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    void closeModalWithUnsavedConfirm(
      hasCustomMaskTermsChanges(draft, terms, newTermText),
      onClose
    );
  }, [draft, newTermText, onClose, terms]);

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

  const handleAddTerm = useCallback(() => {
    const text = newTermText.trim().slice(0, MAX_CUSTOM_MASK_TERM_LENGTH);
    if (!text || draft.length >= MAX_CUSTOM_MASK_TERMS) {
      return;
    }
    if (
      draft.some((term) => getCustomMaskTermDedupKey(term.text) === getCustomMaskTermDedupKey(text))
    ) {
      setNewTermText("");
      newTermInputRef.current?.focus();
      return;
    }
    setDraft((prev) => [...prev, { id: createTermId(), text, enabled: true }]);
    setNewTermText("");
    newTermInputRef.current?.focus();
  }, [draft, newTermText]);

  const handleNewTermKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") {
        return;
      }
      if (e.nativeEvent.isComposing || isComposingRef.current) {
        return;
      }
      e.preventDefault();
      handleAddTerm();
    },
    [handleAddTerm]
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
        className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col rounded-xl bg-white px-6 py-5 shadow-xl outline-none"
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-900">
          マスク語句
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          人名や社名など、OCR
          で自動マスクしたい文字列を登録できます。姓と名が別々に読み取られても、空白の有無は無視して照合します。
        </p>

        <ul className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {draft.length === 0 ? (
            <li className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-sm text-zinc-500">
              登録された語句はありません
            </li>
          ) : (
            draft.map((term) => (
              <li
                key={term.id}
                className={clsx([
                  "flex items-center gap-2 rounded-lg border border-zinc-200 p-2",
                  "hover:border-zinc-300",
                ])}
              >
                <input
                  type="checkbox"
                  checked={term.enabled}
                  aria-label={`${term.text} を有効にする`}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev.map((item) =>
                        item.id === term.id ? { ...item, enabled: e.target.checked } : item
                      )
                    )
                  }
                  className="size-4 shrink-0 rounded border-zinc-300"
                />
                <input
                  type="text"
                  value={term.text}
                  maxLength={MAX_CUSTOM_MASK_TERM_LENGTH}
                  aria-label={`${term.text} を編集`}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev.map((item) =>
                        item.id === term.id ? { ...item, text: e.target.value } : item
                      )
                    )
                  }
                  className="min-w-0 flex-1 rounded border border-zinc-200 px-2 py-1 text-sm text-zinc-800"
                />
                <button
                  type="button"
                  aria-label={`${term.text} を削除`}
                  onClick={() => setDraft((prev) => prev.filter((item) => item.id !== term.id))}
                  className="rounded p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-3 flex gap-2">
          <input
            ref={newTermInputRef}
            id={newTermId}
            type="text"
            value={newTermText}
            maxLength={MAX_CUSTOM_MASK_TERM_LENGTH}
            placeholder="語句を入力"
            onChange={(e) => setNewTermText(e.target.value)}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onKeyDown={handleNewTermKeyDown}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleAddTerm}
            disabled={!newTermText.trim() || draft.length >= MAX_CUSTOM_MASK_TERMS}
            className={clsx([
              "flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium",
              "text-zinc-700 transition-colors hover:bg-zinc-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ])}
          >
            <Plus className="size-4" aria-hidden="true" />
            追加
          </button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          最大 {MAX_CUSTOM_MASK_TERMS} 件 · OCR 自動検出がオンのときのみ適用されます
        </p>

        <div className="mt-5 flex justify-end gap-2">
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
