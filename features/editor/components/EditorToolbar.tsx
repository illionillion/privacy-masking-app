"use client";

import clsx from "clsx";
import { MousePointer2, Pen, Plus } from "lucide-react";
import type React from "react";
import type { LucideProps } from "lucide-react";
import { useNarrowViewport } from "@/lib/useNarrowViewport";
import type { StampCatalogEntry } from "../constants";
import type { EditorMode, StampType } from "../types";
import { StampFacePicker } from "./StampFacePicker";
import { StampTypeSelector } from "./StampTypeSelector";

interface EditorToolbarProps {
  mode: EditorMode;
  selectedStampType: StampType;
  /** stamp-face 種別選択時に表示するスタンプ画像のカタログ（絵文字・ラベル付き） */
  stampCatalog: readonly StampCatalogEntry[];
  /** 現在選択中のスタンプ画像のファイル名 */
  selectedStampFileName: string;
  brushSize: number;
  selectedId: string | null;
  isStampSelected: boolean;
  onChangeMode: (mode: EditorMode) => void;
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

/** ツールバーセクション間の縦線セパレーター */
function Divider() {
  return <div aria-hidden className="h-5 w-px shrink-0 bg-zinc-300" />;
}

interface ModeButtonGroupProps {
  mode: EditorMode;
  onChangeMode: (mode: EditorMode) => void;
}

/** モード切替ピルグループ */
function ModeButtonGroup({ mode, onChangeMode }: ModeButtonGroupProps) {
  return (
    <div className="flex shrink-0 overflow-hidden rounded-md border border-zinc-300 shadow-sm">
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
  );
}

interface DeleteSelectedButtonProps {
  disabled: boolean;
  onClick: () => void;
  className?: string;
}

/** 選択中アイテムの削除ボタン */
function DeleteSelectedButton({ disabled, onClick, className }: DeleteSelectedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx([
        "shrink-0 rounded-md px-3 py-1 text-sm font-medium transition-colors",
        "bg-red-600 text-white hover:bg-red-700",
        disabled && "cursor-not-allowed opacity-50",
        className,
      ])}
    >
      削除
    </button>
  );
}

interface StampControlsProps {
  selectedStampType: StampType;
  stampCatalog: readonly StampCatalogEntry[];
  selectedStampFileName: string;
  onStampTypeChange: (type: StampType) => void;
  onStampFileNameChange: (name: string) => void;
  /** SP 2 段目など狭い行向けのスタンプ種別 select クラス */
  stampTypeClassName?: string;
}

/** スタンプ種別・顔スタンプ選択 */
function StampControls({
  selectedStampType,
  stampCatalog,
  selectedStampFileName,
  onStampTypeChange,
  onStampFileNameChange,
  stampTypeClassName,
}: StampControlsProps) {
  return (
    <>
      <StampTypeSelector
        value={selectedStampType}
        onChange={onStampTypeChange}
        className={stampTypeClassName}
      />
      {selectedStampType === "stamp-face" && (
        <StampFacePicker
          catalog={stampCatalog}
          value={selectedStampFileName}
          onChange={onStampFileNameChange}
        />
      )}
    </>
  );
}

interface BrushControlsProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

/** ペイントブラシサイズ */
function BrushControls({ brushSize, onBrushSizeChange }: BrushControlsProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <label className="shrink-0 text-sm text-zinc-600" htmlFor="brush-size-slider">
        ブラシ: {brushSize}
      </label>
      <input
        id="brush-size-slider"
        type="range"
        min={5}
        max={50}
        value={brushSize}
        onChange={(e) => onBrushSizeChange(Number(e.target.value))}
        className="min-w-0 flex-1"
      />
    </div>
  );
}

/**
 * エディタ操作ツールバーコンポーネント
 *
 * モード切替の右にマスキング種別（矩形追加時 / スタンプ領域選択時）、
 * ペイントブラシ・削除は各モードに応じて表示する。
 * SP では 2 段レイアウトにしてモーダル内の高さ変動を抑える。
 */
export function EditorToolbar({
  mode,
  selectedStampType,
  stampCatalog,
  selectedStampFileName,
  brushSize,
  selectedId,
  isStampSelected,
  onChangeMode,
  onStampTypeChange,
  onStampFileNameChange,
  onBrushSizeChange,
  onDeleteSelected,
}: EditorToolbarProps) {
  const isNarrowViewport = useNarrowViewport();
  const showStampControls = mode === "rect" || isStampSelected;

  if (isNarrowViewport) {
    const reserveStampRow = mode === "select" || mode === "rect";

    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <ModeButtonGroup mode={mode} onChangeMode={onChangeMode} />
            {mode === "select" && (
              <DeleteSelectedButton disabled={selectedId === null} onClick={onDeleteSelected} />
            )}
          </div>

          {reserveStampRow && (
            <div
              className={clsx([
                "flex min-h-9 min-w-0 items-center gap-2",
                !showStampControls && "pointer-events-none invisible",
              ])}
              aria-hidden={!showStampControls}
            >
              <StampControls
                selectedStampType={selectedStampType}
                stampCatalog={stampCatalog}
                selectedStampFileName={selectedStampFileName}
                onStampTypeChange={onStampTypeChange}
                onStampFileNameChange={onStampFileNameChange}
                stampTypeClassName="min-w-0 flex-1 shrink"
              />
            </div>
          )}

          {mode === "paint" && (
            <BrushControls brushSize={brushSize} onBrushSizeChange={onBrushSizeChange} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <ModeButtonGroup mode={mode} onChangeMode={onChangeMode} />

        {showStampControls && (
          <>
            <Divider />
            <StampControls
              selectedStampType={selectedStampType}
              stampCatalog={stampCatalog}
              selectedStampFileName={selectedStampFileName}
              onStampTypeChange={onStampTypeChange}
              onStampFileNameChange={onStampFileNameChange}
            />
          </>
        )}

        {mode === "paint" && (
          <>
            <Divider />
            <BrushControls brushSize={brushSize} onBrushSizeChange={onBrushSizeChange} />
          </>
        )}

        {mode === "select" && (
          <DeleteSelectedButton
            disabled={selectedId === null}
            onClick={onDeleteSelected}
            className="ml-auto"
          />
        )}
      </div>
    </div>
  );
}
