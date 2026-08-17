"use client";

import clsx from "clsx";
import { Crop, MousePointer2, Pen, Plus } from "lucide-react";
import type React from "react";
import type { LucideProps } from "lucide-react";
import { useNarrowViewport } from "@/lib/useNarrowViewport";
import type { StampCatalogEntry } from "../constants";
import type { EditorMode, PaintType, StampType } from "../types";
import { PaintTypeSelector } from "./PaintTypeSelector";
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
  selectedPaintType: PaintType;
  selectedId: string | null;
  isStampSelected: boolean;
  onChangeMode: (mode: EditorMode) => void;
  onStampTypeChange: (type: StampType) => void;
  /** stamp-face 画像選択時のコールバック */
  onStampFileNameChange: (name: string) => void;
  onBrushSizeChange: (size: number) => void;
  onPaintTypeChange: (type: PaintType) => void;
  onDeleteSelected: () => void;
  /** トリミング復元（画像全体に戻す） */
  onRestoreCrop?: () => void;
  /** 復元できる適用済み crop があるか */
  canRestoreCrop?: boolean;
  /** fill-text 領域が選択中か（テキスト編集 UI の表示制御） */
  isTextSelected?: boolean;
  /** 選択中 fill-text 領域の文言 */
  overlayText?: string;
  /** 選択中 fill-text 領域の文字色 */
  textColor?: string;
  /** 選択中 fill-text 領域の背景色 */
  backgroundColor?: string;
  /** 選択中 fill-text 領域の背景を透過するか */
  isBackgroundTransparent?: boolean;
  /** 文言変更コールバック */
  onOverlayTextChange?: (text: string) => void;
  /** 文字色変更コールバック */
  onTextColorChange?: (color: string) => void;
  /** 背景色変更コールバック */
  onBackgroundColorChange?: (color: string) => void;
  /** 背景透過切り替えコールバック */
  onBackgroundTransparentChange?: (transparent: boolean) => void;
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
  { mode: "crop", label: "トリミング", Icon: Crop },
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
  selectedPaintType: PaintType;
  onBrushSizeChange: (size: number) => void;
  onPaintTypeChange: (type: PaintType) => void;
}

interface CropRestoreButtonProps {
  onRestore: () => void;
  disabled: boolean;
}

/** トリミングを画像全体へ戻す */
function CropRestoreButton({ onRestore, disabled }: CropRestoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onRestore}
      disabled={disabled}
      className={clsx([
        "shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50",
        disabled && "cursor-not-allowed opacity-50",
      ])}
    >
      復元
    </button>
  );
}

/** ペイント種別とブラシサイズ */
function BrushControls({
  brushSize,
  selectedPaintType,
  onBrushSizeChange,
  onPaintTypeChange,
}: BrushControlsProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <PaintTypeSelector value={selectedPaintType} onChange={onPaintTypeChange} />
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

interface TextControlsProps {
  overlayText: string;
  textColor: string;
  backgroundColor: string;
  isBackgroundTransparent: boolean;
  onOverlayTextChange: (text: string) => void;
  onTextColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundTransparentChange: (transparent: boolean) => void;
  /** SP など狭い行で 2 段に折り返すか */
  stacked?: boolean;
}

/** fill-text 領域の文言・文字色・背景色（透過含む）を編集する */
function TextControls({
  overlayText,
  textColor,
  backgroundColor,
  isBackgroundTransparent,
  stacked = false,
  onOverlayTextChange,
  onTextColorChange,
  onBackgroundColorChange,
  onBackgroundTransparentChange,
}: TextControlsProps) {
  return (
    <div
      className={clsx([
        "flex flex-1 flex-wrap items-center gap-x-2 gap-y-1.5",
        /* 通常行では下限幅を持たせ、収まらないときツールバー側で次段へ送る */
        stacked ? "min-w-0" : "min-w-[16rem]",
      ])}
    >
      <input
        type="text"
        value={overlayText}
        placeholder="文言"
        aria-label="テキスト文言"
        onChange={(e) => onOverlayTextChange(e.target.value)}
        className={clsx([
          "min-w-0 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          /* 狭い行では文言入力が 1 行を占有し、色・透過が次段へ折り返す */
          stacked ? "w-full basis-full" : "flex-1",
        ])}
      />
      <label className="flex shrink-0 items-center gap-1 text-xs text-zinc-600">
        <span>文字</span>
        <input
          type="color"
          value={textColor}
          aria-label="文字色"
          onChange={(e) => onTextColorChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
        />
      </label>
      <label className="flex shrink-0 items-center gap-1 text-xs text-zinc-600">
        <span>背景</span>
        <input
          type="color"
          value={backgroundColor}
          aria-label="背景色"
          disabled={isBackgroundTransparent}
          onChange={(e) => onBackgroundColorChange(e.target.value)}
          className={clsx([
            "h-7 w-7 rounded border border-zinc-300 bg-white p-0.5",
            isBackgroundTransparent ? "cursor-not-allowed opacity-40" : "cursor-pointer",
          ])}
        />
      </label>
      <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-zinc-600">
        <input
          type="checkbox"
          checked={isBackgroundTransparent}
          aria-label="背景を透過する"
          onChange={(e) => onBackgroundTransparentChange(e.target.checked)}
          className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
        />
        <span>透過</span>
      </label>
    </div>
  );
}

/**
 * エディタ操作ツールバーコンポーネント
 *
 * モード切替の右にマスキング種別（矩形追加時 / スタンプ領域選択時）、
 * ペイントブラシ・削除は各モードに応じて表示する。
 * 削除は選択中アイテムがあるとき表示する（トリミングモードでは非表示）。
 * SP では 2 段レイアウトにしてモーダル内の高さ変動を抑える。
 */
export function EditorToolbar({
  mode,
  selectedStampType,
  stampCatalog,
  selectedStampFileName,
  brushSize,
  selectedPaintType,
  selectedId,
  isStampSelected,
  onChangeMode,
  onStampTypeChange,
  onStampFileNameChange,
  onBrushSizeChange,
  onPaintTypeChange,
  onDeleteSelected,
  onRestoreCrop,
  canRestoreCrop = false,
  isTextSelected = false,
  overlayText = "",
  textColor = "#000000",
  backgroundColor = "#000000",
  isBackgroundTransparent = false,
  onOverlayTextChange,
  onTextColorChange,
  onBackgroundColorChange,
  onBackgroundTransparentChange,
}: EditorToolbarProps) {
  const isNarrowViewport = useNarrowViewport();
  const showStampControls = mode !== "crop" && (mode === "rect" || isStampSelected);
  const showDeleteSelected = mode !== "crop" && selectedId !== null;
  const showCropRestore = mode === "crop" && onRestoreCrop !== undefined;
  const showTextControls =
    mode !== "crop" &&
    isTextSelected &&
    onOverlayTextChange !== undefined &&
    onTextColorChange !== undefined &&
    onBackgroundColorChange !== undefined &&
    onBackgroundTransparentChange !== undefined;

  if (isNarrowViewport) {
    const reserveStampRow = mode === "select" || mode === "rect";

    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <ModeButtonGroup mode={mode} onChangeMode={onChangeMode} />
            {showDeleteSelected && (
              <DeleteSelectedButton disabled={false} onClick={onDeleteSelected} />
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
            <BrushControls
              brushSize={brushSize}
              selectedPaintType={selectedPaintType}
              onBrushSizeChange={onBrushSizeChange}
              onPaintTypeChange={onPaintTypeChange}
            />
          )}

          {showTextControls &&
            onOverlayTextChange &&
            onTextColorChange &&
            onBackgroundColorChange &&
            onBackgroundTransparentChange && (
              <TextControls
                stacked
                overlayText={overlayText}
                textColor={textColor}
                backgroundColor={backgroundColor}
                isBackgroundTransparent={isBackgroundTransparent}
                onOverlayTextChange={onOverlayTextChange}
                onTextColorChange={onTextColorChange}
                onBackgroundColorChange={onBackgroundColorChange}
                onBackgroundTransparentChange={onBackgroundTransparentChange}
              />
            )}

          {showCropRestore && onRestoreCrop && (
            <CropRestoreButton onRestore={onRestoreCrop} disabled={!canRestoreCrop} />
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
            <BrushControls
              brushSize={brushSize}
              selectedPaintType={selectedPaintType}
              onBrushSizeChange={onBrushSizeChange}
              onPaintTypeChange={onPaintTypeChange}
            />
          </>
        )}

        {showTextControls &&
          onOverlayTextChange &&
          onTextColorChange &&
          onBackgroundColorChange &&
          onBackgroundTransparentChange && (
            <>
              <Divider />
              <TextControls
                overlayText={overlayText}
                textColor={textColor}
                backgroundColor={backgroundColor}
                isBackgroundTransparent={isBackgroundTransparent}
                onOverlayTextChange={onOverlayTextChange}
                onTextColorChange={onTextColorChange}
                onBackgroundColorChange={onBackgroundColorChange}
                onBackgroundTransparentChange={onBackgroundTransparentChange}
              />
            </>
          )}

        {showCropRestore && onRestoreCrop && (
          <>
            <Divider />
            <CropRestoreButton onRestore={onRestoreCrop} disabled={!canRestoreCrop} />
          </>
        )}

        {showDeleteSelected && (
          <DeleteSelectedButton onClick={onDeleteSelected} disabled={false} className="ml-auto" />
        )}
      </div>
    </div>
  );
}
