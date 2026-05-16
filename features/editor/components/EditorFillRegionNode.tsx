"use client";

import Konva from "konva";
import { Group, Rect } from "react-konva";
import type { FillRegion } from "../types";

export interface EditorFillRegionNodeProps {
  region: FillRegion;
  scaleX: number;
  scaleY: number;
  isInteractive: boolean;
  onSelect: () => void;
  onDragEnd: (node: Konva.Node) => void;
  onTransformEnd: (node: Konva.Node) => void;
}

/**
 * 塗りつぶし（黒塗り）領域 1 件分の Konva ノード
 */
export function EditorFillRegionNode({
  region,
  scaleX,
  scaleY,
  isInteractive,
  onSelect,
  onDragEnd,
  onTransformEnd,
}: EditorFillRegionNodeProps) {
  return (
    <Group
      id={region.id}
      x={region.x * scaleX}
      y={region.y * scaleY}
      draggable={isInteractive}
      onClick={() => isInteractive && onSelect()}
      onTap={() => isInteractive && onSelect()}
      onDragEnd={(e) => onDragEnd(e.target)}
      onTransformEnd={(e) => onTransformEnd(e.target)}
    >
      <Rect
        width={region.width * scaleX}
        height={region.height * scaleY}
        fill={region.isEnabled ? "#000000" : undefined}
        stroke={region.isEnabled ? "#3b82f6" : "#9ca3af"}
        strokeWidth={1}
        dash={region.isEnabled ? undefined : [6, 3]}
        opacity={region.isEnabled ? 1 : 0.6}
      />
    </Group>
  );
}
