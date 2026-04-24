"use client";

import clsx from "clsx";
import type { StampType } from "../types";

interface StampTypeSelectorProps {
  value: StampType;
  onChange: (type: StampType) => void;
}

/** スタンプ種別の選択肢定義 */
const STAMP_OPTIONS: { type: StampType; label: string }[] = [
  { type: "stamp-face", label: "スタンプ" },
  { type: "fill-black", label: "黒塗り" },
  { type: "mosaic", label: "モザイク" },
  { type: "blur", label: "ぼかし" },
];

/**
 * スタンプ種別選択コンポーネント
 *
 * 矩形モードでスタンプを追加する際に種別を選択する。
 */
export function StampTypeSelector({ value, onChange }: StampTypeSelectorProps) {
  return (
    <div className="flex gap-1">
      {STAMP_OPTIONS.map(({ type, label }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={clsx([
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            value === type
              ? "bg-orange-500 text-white"
              : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
          ])}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
