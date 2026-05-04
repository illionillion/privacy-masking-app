"use client";

import clsx from "clsx";
import { MousePointer2, Pen, Plus } from "lucide-react";
import type React from "react";
import type { LucideProps } from "lucide-react";
import type { StampCatalogEntry } from "../constants";
import type { EditorMode, RectAddTarget, StampType } from "../types";
import { StampTypeSelector } from "./StampTypeSelector";

interface EditorToolbarProps {
  mode: EditorMode;
  rectTarget: RectAddTarget;
  selectedStampType: StampType;
  /** stamp-face 種別選択時に表示するスタンプ画像のカタログ（絵文字・ラベル付き） */
  stampCatalog: readonly StampCatalogEntry[];
  /** 現在選択中のスタンプ画像のファイル名 */
  selectedStampFileName: string;
  brushSize: number;
  selectedId: string | null;
  isStampSelected: boolean;
  onChangeMode: (mode: EditorMode) => void;
  onRectTargetChange: (target: RectAddTarget) => void;
  onStampTypeChange: (type: StampType) => void;
  /** stamp-face 画像選択時のコールバック */
  onStampFileNameChange: (name: string) => void;
  onBrushSizeChange: (size: number) => void;
  onDeleteSelected: () => void;
}

/** モードボタンの定義 */
const MODE_BUTTONS: {
  mode: EditorMode;
  label: string;
  Icon: React.ComponentType<LucideProps>;
}[] = [
  { mode: "select", label: "選択", Icon: MousePointer2 },
  { mode: "rect", label: "追加", Icon: Plus },
  { mode: "paint", label: "ペイント", Icon: Pen },
];

/** 矩形追加ターゲットボタンの定義 */
const RECT_TARGET_BUTTONS: { target: RectAddTarget; label: string }[] = [
  { target: "fill", label: "塗りつぶし" },
  { target: "stamp", label: "スタンプ" },
];

/** ツールバーセクション間の縦線セパレーター */
function Divider() {
  return <div aria-hidden className="h-5 w-px shrink-0 bg-zinc-300" />;
}

/**
 * エディタ操作ツールバーコンポーネント
 *
 * 1行目: モード切替・矩形ターゲット・ペイントブラシ・削除ボタン（常に固定）
 * 2行目: スタンプコントロール（スタンプ追加時 / スタンプ選択時のみ表示）
 */
export function EditorToolbar({
  mode,
  rectTarget,
  selectedStampType,
  stampCatalog,
  selectedStampFileName,
  brushSize,
  selectedId,
  isStampSelected,
  onChangeMode,
  onRectTargetChange,
  onStampTypeChange,
  onStampFileNameChange,
  onBrushSizeChange,
  onDeleteSelected,
}: EditorToolbarProps) {
  const showStampControls = (mode === "rect" && rectTarget === "stamp") || isStampSelected;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
      {/* 1行目: 主要コントロール */}
      <div className="flex items-center gap-x-2">
        {/* モード切替: ピルグループ（アイコンのみ・title でツールチップ） */}
        <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
          {MODE_BUTTONS.map(({ mode: m, label, Icon }, i) => (
            <button
              key={m}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={mode === m}
              onClick={() => onChangeMode(m)}
              className={clsx([
                "flex items-center px-2.5 py-1.5 transition-colors",
                i > 0 && "border-l border-zinc-300",
                mode === m ? "bg-blue-600 text-white" : "bg-white text-zinc-700 hover:bg-zinc-50",
              ])}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* 矩形ターゲット: ピルグループ */}
        {mode === "rect" && (
          <>
            <Divider />
            <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
              {RECT_TARGET_BUTTONS.map(({ target, label }, i) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => onRectTargetChange(target)}
                  className={clsx([
                    "shrink-0 whitespace-nowrap px-3 py-1 text-sm font-medium transition-colors",
                    i > 0 && "border-l border-zinc-300",
                    rectTarget === target
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-zinc-700 hover:bg-zinc-50",
                  ])}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ペイントブラシサイズスライダー */}
        {mode === "paint" && (
          <>
            <Divider />
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-600" htmlFor="brush-size-slider">
                ブラシ: {brushSize}
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
          </>
        )}

        {/* 削除ボタン */}
        {mode === "select" && (
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={selectedId === null}
            className={clsx([
              "ml-auto rounded-md px-3 py-1 text-sm font-medium transition-colors",
              "bg-red-600 text-white hover:bg-red-700",
              selectedId === null && "cursor-not-allowed opacity-50",
            ])}
          >
            削除
          </button>
        )}
      </div>

      {/* 2行目: スタンプコントロール（スタンプ追加時 / スタンプ選択時） */}
      {showStampControls && (
        <div className="flex items-center gap-x-2 border-t border-zinc-200 pt-1.5">
          <StampTypeSelector value={selectedStampType} onChange={onStampTypeChange} />
          {selectedStampType === "stamp-face" && stampCatalog.length > 0 && (
            <select
              value={selectedStampFileName}
              onChange={(e) => onStampFileNameChange(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stampCatalog.map(({ fileName, emoji, label }) => (
                <option key={fileName} value={fileName}>
                  {emoji} {label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
