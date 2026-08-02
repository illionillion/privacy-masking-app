"use client";

import Konva from "konva";
import { Fragment } from "react";
import { Group, Image as KonvaImage, Rect } from "react-konva";
import { pickStampImage } from "../lib/pickStampImage";
import { getStampRegionRotationDeg } from "../lib/stampRegionTransform";
import type { StampRegion, StampType } from "../types";
import { EditorStampEffectPreview } from "./EditorStampEffectPreview";

/** スタンプ種別ごとの表示色（不透明矩形フォールバック用） */
const STAMP_TYPE_COLORS: Record<StampType, string> = {
  "fill-black": "#000000",
  mosaic: "#6b7280",
  blur: "#93c5fd",
  "stamp-face": "#fb923c",
};

export interface EditorStampRegionNodeProps {
  region: StampRegion;
  scaleX: number;
  scaleY: number;
  isInteractive: boolean;
  selected: boolean;
  stampImages: Map<string, HTMLImageElement>;
  bgImage: HTMLImageElement | null;
  stageWidth: number;
  stageHeight: number;
  onSelect: () => void;
  onDragEnd: (node: Konva.Node) => void;
  onTransformEnd: (node: Konva.Node) => void;
}

/**
 * スタンプ領域 1 件分の Konva ノード（エフェクトプレビュー付き）
 */
export function EditorStampRegionNode({
  region,
  scaleX,
  scaleY,
  isInteractive,
  selected,
  stampImages,
  bgImage,
  stageWidth,
  stageHeight,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: EditorStampRegionNodeProps) {
  const rx = region.x * scaleX;
  const ry = region.y * scaleY;
  const w = region.width * scaleX;
  const h = region.height * scaleY;
  const rotation = getStampRegionRotationDeg(region);
  const squareStampSize = Math.max(w, h);
  const squareStampX = (w - squareStampSize) / 2;
  const squareStampY = (h - squareStampSize) / 2;
  const stampImg = region.stampType === "stamp-face" ? pickStampImage(region, stampImages) : null;
  const isEffectStamp =
    (region.stampType === "blur" || region.stampType === "mosaic") && bgImage !== null;
  const strokeColor = selected ? "#1d4ed8" : "#6b7280";

  return (
    <Fragment>
      {isEffectStamp && (
        /* blur / mosaic の見た目は操作ノードと分離し、Transformer の計算へ影響させない */
        <Group x={rx} y={ry} rotation={rotation} listening={false}>
          <EditorStampEffectPreview
            kind={region.stampType as "blur" | "mosaic"}
            bgImage={bgImage}
            offsetX={-rx}
            offsetY={-ry}
            counterRotation={-rotation}
            stageWidth={stageWidth}
            stageHeight={stageHeight}
            w={w}
            h={h}
          />
        </Group>
      )}

      <Group
        id={region.id}
        x={rx}
        y={ry}
        rotation={rotation}
        draggable={isInteractive}
        onClick={() => isInteractive && onSelect()}
        onTap={() => isInteractive && onSelect()}
        onDragEnd={(e) => onDragEnd(e.target)}
        onTransformEnd={(e) => onTransformEnd(e.target)}
      >
        {stampImg ? (
          /* stamp-face: 顔領域中心を基準に正方形スタンプを表示（旧仕様互換） */
          <KonvaImage
            image={stampImg}
            x={squareStampX}
            y={squareStampY}
            width={squareStampSize}
            height={squareStampSize}
            opacity={region.isEnabled ? 1 : 0.4}
            stroke={strokeColor}
            strokeWidth={1}
          />
        ) : isEffectStamp ? (
          /* blur / mosaic: クリック/変形用の矩形ハンドル */
          <Rect
            width={w}
            height={h}
            fill="rgba(0,0,0,0.001)"
            stroke={strokeColor}
            strokeWidth={1}
            listening={true}
          />
        ) : (
          /* fill-black またはフォールバック: 不透明な塗りつぶし矩形 */
          <Rect
            width={w}
            height={h}
            fill={STAMP_TYPE_COLORS[region.stampType]}
            opacity={1}
            stroke={strokeColor}
            strokeWidth={1}
          />
        )}
      </Group>
    </Fragment>
  );
}
