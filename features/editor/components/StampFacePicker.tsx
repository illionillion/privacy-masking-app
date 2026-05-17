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
  const activeIndexRef = useRef(activeIndex);
  const onChangeRef = useRef(onChange);
  const catalogRef = useRef(catalog);
  const listboxId = useId();

  const selectedIndex = catalog.findIndex((entry) => entry.fileName === value);
  const selected = catalog[selectedIndex >= 0 ? selectedIndex : 0];

  /** listbox 内 option 要素の id（aria-activedescendant 用） */
  const getOptionId = (index: number) => `${listboxId}-option-${index}`;

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  const openList = useCallback(() => {
    const index = selectedIndex >= 0 ? selectedIndex : 0;
    activeIndexRef.current = index;
    setActiveIndex(index);
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

  const handleComboboxKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!open) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openList();
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      const { length } = catalogRef.current;
      if (length === 0) {
        setOpen(false);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => {
          const next = (index + 1) % length;
          activeIndexRef.current = next;
          return next;
        });
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => {
          const next = (index - 1 + length) % length;
          activeIndexRef.current = next;
          return next;
        });
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const entry = catalogRef.current[activeIndexRef.current];
        if (!entry) return;
        onChangeRef.current(entry.fileName);
        setOpen(false);
      }
    },
    [open, openList]
  );

  if (catalog.length === 0) return null;

  const activeOptionId = getOptionId(activeIndex);

  return (
    <div ref={containerRef} className={clsx("relative shrink-0", open && "z-50")}>
      <button
        type="button"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? activeOptionId : undefined}
        aria-label={selected ? `スタンプ: ${selected.label}` : "スタンプ画像"}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openList();
          }
        }}
        onKeyDown={handleComboboxKeyDown}
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
        <div
          className={clsx([
            "absolute top-full left-0 z-50 mt-1 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg",
            /* Safari: スクロール層の背景が透けるのを防ぐ */
            "[transform:translateZ(0)]",
          ])}
        >
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="スタンプ画像"
            className={clsx([
              "m-0 max-h-48 list-none overflow-y-auto bg-white py-1",
              "[-webkit-overflow-scrolling:touch]",
            ])}
          >
            {catalog.map((entry, index) => (
              <li
                key={entry.fileName}
                id={getOptionId(index)}
                role="option"
                data-index={index}
                aria-selected={entry.fileName === value}
                className={clsx([
                  "flex cursor-pointer items-center gap-2 bg-white px-2 py-2 text-sm text-zinc-700",
                  entry.fileName === value && "bg-blue-50",
                  index === activeIndex && entry.fileName !== value && "bg-zinc-100",
                  index === activeIndex && entry.fileName === value && "bg-blue-100",
                ])}
                onMouseEnter={() => {
                  activeIndexRef.current = index;
                  setActiveIndex(index);
                }}
                onClick={() => handleSelect(entry.fileName)}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {entry.emoji}
                </span>
                <span className="min-w-0 truncate">{entry.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
