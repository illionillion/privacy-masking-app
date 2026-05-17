"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { StampCatalogEntry } from "../constants";

interface StampFacePickerProps {
  catalog: readonly StampCatalogEntry[];
  value: string;
  onChange: (fileName: string) => void;
}

/**
 * スタンプ画像選択ピッカー
 *
 * トリガーは絵文字のみのコンパクト表示。一覧では絵文字とラベルを表示する。
 */
export function StampFacePicker({ catalog, value, onChange }: StampFacePickerProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selectedIndex = catalog.findIndex((entry) => entry.fileName === value);
  const selected = catalog[selectedIndex >= 0 ? selectedIndex : 0];

  const openList = useCallback(() => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [selectedIndex]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % catalog.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + catalog.length) % catalog.length);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const entry = catalog[activeIndex];
        if (!entry) return;
        onChange(entry.fileName);
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, activeIndex, catalog, onChange]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const option = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    option?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, open]);

  const handleSelect = useCallback(
    (fileName: string) => {
      onChange(fileName);
      setOpen(false);
    },
    [onChange]
  );

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (open) return;
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openList();
      }
    },
    [open, openList]
  );

  if (catalog.length === 0) return null;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={selected ? `スタンプ: ${selected.label}` : "スタンプ画像"}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openList();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={clsx([
          "flex items-center gap-0.5 rounded-md border border-zinc-300 bg-white px-1.5 py-1.5 shadow-sm",
          "hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
        ])}
      >
        <span className="text-base leading-none" aria-hidden="true">
          {selected?.emoji ?? "?"}
        </span>
        <ChevronDown size={14} className="text-zinc-500" aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="スタンプ画像"
          className="absolute top-full left-0 z-50 mt-1 max-h-48 w-56 overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {catalog.map((entry, index) => (
            <li
              key={entry.fileName}
              role="option"
              aria-selected={entry.fileName === value}
              data-index={index}
              className={clsx([
                "flex cursor-pointer items-center gap-2 px-2 py-2 text-sm text-zinc-700",
                entry.fileName === value && "bg-blue-50",
                index === activeIndex && entry.fileName !== value && "bg-zinc-100",
                index === activeIndex && entry.fileName === value && "bg-blue-100",
              ])}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => handleSelect(entry.fileName)}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {entry.emoji}
              </span>
              <span className="min-w-0 truncate">{entry.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
