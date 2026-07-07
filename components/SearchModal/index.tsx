"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef } from "react";
import { SiteSearch } from "@/components/SiteSearch";
import { useSearchIndexStore } from "@/lib/searchIndexStore";
import { useSearchModalStore } from "@/lib/searchModalStore";

/**
 * サイト内検索モーダル。オーバーレイ・Esc・背景クリックで閉じる。
 */
export function SearchModal() {
  const { isOpen, close } = useSearchModalStore();
  const preload = useSearchIndexStore((state) => state.preload);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    preload();
  }, [isOpen, preload]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const prevOverflow = document.body.style.overflow;
    const prevFocusedElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocusedElement?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isOpen]);

  const handleKeyDownDialog = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20"
      onKeyDown={handleKeyDownDialog}
    >
      <div
        role="presentation"
        data-testid="search-modal-overlay"
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={close}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
        className={clsx([
          "relative",
          "z-10",
          "flex",
          "h-[min(36rem,calc(100dvh-2rem))]",
          "w-full",
          "max-w-2xl",
          "flex-col",
          "overflow-hidden",
          "rounded-xl",
          "bg-white",
          "shadow-xl",
        ])}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
          <h2 id="search-modal-title" className="text-base font-semibold text-zinc-900">
            サイト内検索
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="検索を閉じる"
            onClick={close}
            className="inline-flex size-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
          <SiteSearch onResultSelect={close} />
        </div>
      </div>
    </div>
  );
}
