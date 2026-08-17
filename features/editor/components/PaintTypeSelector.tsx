"use client";

import type { PaintType } from "../types";

interface PaintTypeSelectorProps {
  value: PaintType;
  onChange: (type: PaintType) => void;
}

/** ペイントで使用できるマスキング種別 */
const PAINT_OPTIONS: { type: PaintType; label: string }[] = [
  { type: "fill-black", label: "⬛ 黒塗り" },
  { type: "mosaic", label: "🟦 モザイク" },
  { type: "blur", label: "🌫️ ぼかし" },
];

/** ペイントのマスキング種別を選択する */
export function PaintTypeSelector({ value, onChange }: PaintTypeSelectorProps) {
  return (
    <select
      value={value}
      aria-label="ペイント種別"
      onChange={(event) => onChange(event.target.value as PaintType)}
      className="max-w-[8.5rem] shrink-0 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {PAINT_OPTIONS.map(({ type, label }) => (
        <option key={type} value={type}>
          {label}
        </option>
      ))}
    </select>
  );
}
