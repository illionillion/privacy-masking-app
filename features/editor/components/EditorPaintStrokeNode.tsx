"use client";

import Konva from "konva";
import { useMemo } from "react";
import { Group, Image as KonvaImage, Line } from "react-konva";
import type { PaintStroke } from "../types";

/** モザイクの最小ブロックサイズ（表示ピクセル） */
const MIN_MOSAIC_BLOCK_SIZE = 3;

interface EditorPaintStrokeNodeProps {
  stroke: PaintStroke;
  scaleX: number;
  scaleY: number;
  bgImage: HTMLImageElement | null;
  stageWidth: number;
  stageHeight: number;
  isInteractive: boolean;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (node: Konva.Line | Konva.Group) => void;
  onTransformEnd: (node: Konva.Line | Konva.Group) => void;
}

interface PaintEffectCanvas {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
}

/** ストローク形状で切り抜いたモザイク・ぼかし画像を生成する */
function createEffectCanvas(
  stroke: PaintStroke,
  bgImage: HTMLImageElement,
  scaleX: number,
  scaleY: number,
  stageWidth: number,
  stageHeight: number
): PaintEffectCanvas | null {
  if (stroke.points.length < 2) return null;

  const scaledPoints = stroke.points.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
  const padding = Math.max(2, (stroke.brushSize * scaleX) / 2 + 8);
  const x = Math.max(0, Math.floor(Math.min(...scaledPoints.map((point) => point.x)) - padding));
  const y = Math.max(0, Math.floor(Math.min(...scaledPoints.map((point) => point.y)) - padding));
  const right = Math.min(
    stageWidth,
    Math.ceil(Math.max(...scaledPoints.map((point) => point.x)) + padding)
  );
  const bottom = Math.min(
    stageHeight,
    Math.ceil(Math.max(...scaledPoints.map((point) => point.y)) + padding)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, right - x);
  canvas.height = Math.max(1, bottom - y);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const paintType = stroke.paintType ?? "fill-black";
  if (paintType === "blur") {
    ctx.filter = `blur(${Math.max(4, Math.round((stroke.brushSize * scaleX) / 8))}px)`;
    ctx.drawImage(bgImage, -x, -y, stageWidth, stageHeight);
    ctx.filter = "none";
  } else {
    const sampleCanvas = document.createElement("canvas");
    const blockSize = Math.max(MIN_MOSAIC_BLOCK_SIZE, Math.round((stroke.brushSize * scaleX) / 8));
    sampleCanvas.width = Math.max(1, Math.ceil(canvas.width / blockSize));
    sampleCanvas.height = Math.max(1, Math.ceil(canvas.height / blockSize));
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) return null;
    const imageWidth = bgImage.naturalWidth || bgImage.width;
    const imageHeight = bgImage.naturalHeight || bgImage.height;
    const safeStageWidth = Math.max(1, stageWidth);
    const safeStageHeight = Math.max(1, stageHeight);
    sampleCtx.imageSmoothingEnabled = true;
    sampleCtx.drawImage(
      bgImage,
      (x / safeStageWidth) * imageWidth,
      (y / safeStageHeight) * imageHeight,
      (canvas.width / safeStageWidth) * imageWidth,
      (canvas.height / safeStageHeight) * imageHeight,
      0,
      0,
      sampleCanvas.width,
      sampleCanvas.height
    );
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sampleCanvas, 0, 0, canvas.width, canvas.height);
  }

  ctx.globalCompositeOperation = "destination-in";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = stroke.brushSize * scaleX;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(scaledPoints[0]!.x - x, scaledPoints[0]!.y - y);
  for (let index = 1; index < stroke.points.length; index++) {
    const point = scaledPoints[index]!;
    ctx.lineTo(point.x - x, point.y - y);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  return { canvas, x, y };
}

/** ペイントストロークを黒塗りまたは画像エフェクトとして描画する */
export function EditorPaintStrokeNode({
  stroke,
  scaleX,
  scaleY,
  bgImage,
  stageWidth,
  stageHeight,
  isInteractive,
  selected,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: EditorPaintStrokeNodeProps) {
  const points = stroke.points.flatMap((point) => [point.x * scaleX, point.y * scaleY]);
  const paintType = stroke.paintType ?? "fill-black";
  const effectCanvas = useMemo(
    () =>
      paintType !== "fill-black" && bgImage
        ? createEffectCanvas(stroke, bgImage, scaleX, scaleY, stageWidth, stageHeight)
        : null,
    [paintType, stroke, bgImage, scaleX, scaleY, stageWidth, stageHeight]
  );

  if (paintType === "fill-black" || !effectCanvas) {
    return (
      <Line
        id={stroke.id}
        points={points}
        stroke="#000000"
        strokeWidth={stroke.brushSize * scaleX}
        lineCap="round"
        lineJoin="round"
        opacity={stroke.isEnabled ? 1 : 0.3}
        hitStrokeWidth={Math.max(stroke.brushSize * scaleX, 12)}
        listening={isInteractive}
        draggable={isInteractive}
        onClick={() => isInteractive && onSelect()}
        onTap={() => isInteractive && onSelect()}
        onDragEnd={(event) => onDragEnd(event.target as Konva.Line)}
        onTransformEnd={(event) => onTransformEnd(event.target as Konva.Line)}
      />
    );
  }

  return (
    <Group
      id={stroke.id}
      draggable={isInteractive}
      opacity={stroke.isEnabled ? 1 : 0.3}
      onClick={() => isInteractive && onSelect()}
      onTap={() => isInteractive && onSelect()}
      onDragEnd={(event) => onDragEnd(event.target as Konva.Group)}
      onTransformEnd={(event) => onTransformEnd(event.target as Konva.Group)}
    >
      <KonvaImage
        image={effectCanvas.canvas}
        x={effectCanvas.x}
        y={effectCanvas.y}
        width={effectCanvas.canvas.width}
        height={effectCanvas.canvas.height}
        listening={false}
      />
      <Line
        name="paint-hit-line"
        points={points}
        stroke={selected ? "#1d4ed8" : "rgba(0,0,0,0.001)"}
        strokeWidth={selected ? 2 : stroke.brushSize * scaleX}
        dash={selected ? [6, 3] : undefined}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={Math.max(stroke.brushSize * scaleX, 12)}
      />
    </Group>
  );
}
