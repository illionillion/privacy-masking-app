"use client";

import clsx from "clsx";
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
const MODE_BUTTONS: { mode: EditorMode; label: string }[] = [
  { mode: "select", label: "選択" },
  { mode: "rect", label: "矩形" },
  { mode: "paint", label: "ペイント" },
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
 * モード切替・矩形追加ターゲット選択・スタンプ種別選択・ブラシサイズ調整・
 * 選択アイテム削除ボタンを提供する。
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
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
      {/* モード切替: ピルグループ */}
      <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
        {MODE_BUTTONS.map(({ mode: m, label }, i) => (
          <button
            key={m}
            type="button"
            onClick={() => onChangeMode(m)}
            className={clsx([
              "px-3 py-1 text-sm font-medium transition-colors",
              i > 0 && "border-l border-zinc-300",
              mode === m ? "bg-blue-600 text-white" : "bg-white text-zinc-700 hover:bg-zinc-50",
            ])}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 矩形モード時の追加オプション */}
      {mode === "rect" && (
        <>
          <Divider />

          {/* 矩形ターゲット: ピルグループ */}
          <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
            {RECT_TARGET_BUTTONS.map(({ target, label }, i) => (
              <button
                key={target}
                type="button"
                onClick={() => onRectTargetChange(target)}
                className={clsx([
                  "px-3 py-1 text-sm font-medium transition-colors",
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

      {/* スタンプ種別・画像選択（スタンプ追加時 / スタンプ選択時） */}
      {showStampControls && (
        <>
          <Divider />
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
        </>
      )}

      {/* ペイントモード時のブラシサイズスライダー */}
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
    </div>
  );
}
