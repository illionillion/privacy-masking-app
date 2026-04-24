"use client";

import clsx from "clsx";
import type { EditorMode, RectAddTarget, StampType } from "../types";
import { StampTypeSelector } from "./StampTypeSelector";

interface EditorToolbarProps {
  mode: EditorMode;
  rectTarget: RectAddTarget;
  selectedStampType: StampType;
  brushSize: number;
  selectedId: string | null;
  onModeChange: (mode: EditorMode) => void;
  onRectTargetChange: (target: RectAddTarget) => void;
  onStampTypeChange: (type: StampType) => void;
  onBrushSizeChange: (size: number) => void;
  onDeleteSelected: () => void;
}

/** モードボタンの定義 */
const MODE_BUTTONS: { mode: EditorMode; label: string }[] = [
  { mode: "select", label: "選択" },
  { mode: "rect", label: "矩形" },
  { mode: "paint", label: "ペイント" },
];

/**
 * エディタ操作ツールバーコンポーネント
 *
 * モード切替・矩形追加ターゲット選択・スタンプ種別選択・ブラシサイズ調整・
 * 選択アイテム削除ボタンを提供する。
 */
export function EditorToolbar({
  mode,
  rectTarget,
  selectedStampType,
  brushSize,
  selectedId,
  onModeChange,
  onRectTargetChange,
  onStampTypeChange,
  onBrushSizeChange,
  onDeleteSelected,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
      {/* モード切替ボタン */}
      <div className="flex gap-1">
        {MODE_BUTTONS.map(({ mode: m, label }) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={clsx([
              "rounded px-3 py-1 text-sm font-medium transition-colors",
              mode === m
                ? "bg-blue-600 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
            ])}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 矩形モード時の追加オプション */}
      {mode === "rect" && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onRectTargetChange("fill")}
              className={clsx([
                "rounded px-3 py-1 text-sm font-medium transition-colors",
                rectTarget === "fill"
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
              ])}
            >
              塗りつぶし
            </button>
            <button
              type="button"
              onClick={() => onRectTargetChange("stamp")}
              className={clsx([
                "rounded px-3 py-1 text-sm font-medium transition-colors",
                rectTarget === "stamp"
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
              ])}
            >
              スタンプ
            </button>
          </div>
          {rectTarget === "stamp" && (
            <StampTypeSelector value={selectedStampType} onChange={onStampTypeChange} />
          )}
        </div>
      )}

      {/* ペイントモード時のブラシサイズスライダー */}
      {mode === "paint" && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-600" htmlFor="brush-size-slider">
            ブラシサイズ: {brushSize}
          </label>
          <input
            id="brush-size-slider"
            type="range"
            min={5}
            max={50}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}

      {/* 削除ボタン */}
      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={selectedId === null}
        className={clsx([
          "ml-auto rounded px-3 py-1 text-sm font-medium transition-colors",
          "bg-red-600 text-white hover:bg-red-700",
          selectedId === null && "cursor-not-allowed opacity-50",
        ])}
      >
        削除
      </button>
    </div>
  );
}
