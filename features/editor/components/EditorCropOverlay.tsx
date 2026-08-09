"use client";

import { Rect } from "react-konva";
import type { CropRect } from "../types";

/** crop 枠外の暗幕色 */
const CROP_DIM_FILL = "rgba(0,0,0,0.45)";

interface EditorCropOverlayProps {
  crop: CropRect;
  stageWidth: number;
  stageHeight: number;
  scaleX: number;
  scaleY: number;
}

/**
 * 適用済み／ドラフト crop の外側を暗くするオーバーレイ
 *
 * スタンプより下に置き、枠外マスクの操作を妨げない。
 */
export function EditorCropOverlay({
  crop,
  stageWidth,
  stageHeight,
  scaleX,
  scaleY,
}: EditorCropOverlayProps) {
  const x = crop.x * scaleX;
  const y = crop.y * scaleY;
  const width = crop.width * scaleX;
  const height = crop.height * scaleY;

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={stageWidth}
        height={Math.max(0, y)}
        fill={CROP_DIM_FILL}
        listening={false}
      />
      <Rect
        x={0}
        y={y + height}
        width={stageWidth}
        height={Math.max(0, stageHeight - y - height)}
        fill={CROP_DIM_FILL}
        listening={false}
      />
      <Rect
        x={0}
        y={y}
        width={Math.max(0, x)}
        height={height}
        fill={CROP_DIM_FILL}
        listening={false}
      />
      <Rect
        x={x + width}
        y={y}
        width={Math.max(0, stageWidth - x - width)}
        height={height}
        fill={CROP_DIM_FILL}
        listening={false}
      />
    </>
  );
}
