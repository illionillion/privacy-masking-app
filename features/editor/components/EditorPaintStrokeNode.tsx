"use client";

import Konva from "konva";
import { useMemo } from "react";
import { Group, Image as KonvaImage, Line } from "react-konva";
import {
  computePaintBlurRadius,
  computePaintMosaicBlockSize,
  computePaintStrokeBounds,
  resolvePaintType,
} from "../lib/paintStroke";
import type { PaintStroke } from "../types";

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

/**
 * ストローク形状で切り抜いたモザイク・ぼかし画像を生成する
 *
 * ドラッグ・変形後に Konva ノードへ即座に反映するため、描画コンポーネント外からも利用する。
 */
export function createPaintStrokeEffectCanvas(
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
  const brushWidth = stroke.brushSize * scaleX;
  const bounds = computePaintStrokeBounds(scaledPoints, brushWidth, stageWidth, stageHeight);
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const paintType = resolvePaintType(stroke);
  if (paintType === "blur") {
    ctx.filter = `blur(${computePaintBlurRadius(brushWidth)}px)`;
    ctx.drawImage(bgImage, -bounds.x, -bounds.y, stageWidth, stageHeight);
    ctx.filter = "none";
  } else {
    /* ブロックサイズはブラシ幅基準にし、書き出しと見た目を揃える（外接矩形基準にしない） */
    const blockSize = computePaintMosaicBlockSize(brushWidth);
    const sampleCanvas = document.createElement("canvas");
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
      (bounds.x / safeStageWidth) * imageWidth,
      (bounds.y / safeStageHeight) * imageHeight,
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
  ctx.lineWidth = brushWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(scaledPoints[0]!.x - bounds.x, scaledPoints[0]!.y - bounds.y);
  for (let index = 1; index < stroke.points.length; index++) {
    const point = scaledPoints[index]!;
    ctx.lineTo(point.x - bounds.x, point.y - bounds.y);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  return { canvas, x: bounds.x, y: bounds.y };
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
  const paintType = resolvePaintType(stroke);
  const effectCanvas = useMemo(
    () =>
      paintType !== "fill-black" && bgImage
        ? createPaintStrokeEffectCanvas(stroke, bgImage, scaleX, scaleY, stageWidth, stageHeight)
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
      listening={isInteractive}
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
        listening={isInteractive}
      />
    </Group>
  );
}
