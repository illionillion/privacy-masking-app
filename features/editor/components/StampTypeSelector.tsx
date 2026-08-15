"use client";

import clsx from "clsx";
import type { StampType } from "../types";

interface StampTypeSelectorProps {
  value: StampType;
  onChange: (type: StampType) => void;
  className?: string;
}

/** スタンプ種別の選択肢定義 */
const STAMP_OPTIONS: { type: StampType; label: string }[] = [
  { type: "stamp-face", label: "😊 顔スタンプ" },
  { type: "fill-black", label: "⬛ 黒塗り" },
  { type: "mosaic", label: "🟦 モザイク" },
  { type: "blur", label: "🌫️ ぼかし" },
  { type: "fill-text", label: "🅰️ テキスト" },
];

/**
 * スタンプ種別選択セレクトボックスコンポーネント
 *
 * 矩形モードでスタンプを追加する際に種別を選択する。
 */
export function StampTypeSelector({ value, onChange, className }: StampTypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StampType)}
      className={clsx([
        "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
        className ?? "max-w-[8.5rem] shrink-0",
      ])}
    >
      {STAMP_OPTIONS.map(({ type, label }) => (
        <option key={type} value={type}>
          {label}
        </option>
      ))}
    </select>
  );
}
