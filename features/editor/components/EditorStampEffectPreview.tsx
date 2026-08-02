"use client";

import Konva from "konva";
import { useEffect, useRef } from "react";
import { Group, Image as KonvaImage } from "react-konva";

/** filters プロパティの要素型（Konva.Filter は v10 では直接エクスポートされないため NodeConfig から取得） */
type KonvaFilter = NonNullable<Konva.NodeConfig["filters"]>[number];

/** モザイクブロックの最小サイズ（px） */
const MIN_MOSAIC_BLOCK_SIZE = 3;

/** モザイクブロックサイズ算出用の除数（短辺に対する割合の逆数） */
const MOSAIC_BLOCK_SIZE_DIVISOR = 24;

/**
 * モザイク（ピクセレーション）プレビュー用 Konva カスタムフィルター
 *
 * ブロックサイズは領域短辺の 1/24（最小 3px）で自動算出する。
 */
const pixelateFilter: KonvaFilter = function (imageData: ImageData) {
  const size = Math.max(
    MIN_MOSAIC_BLOCK_SIZE,
    Math.round(Math.min(imageData.width, imageData.height) / MOSAIC_BLOCK_SIZE_DIVISOR)
  );
  for (let y = 0; y < imageData.height; y += size) {
    for (let x = 0; x < imageData.width; x += size) {
      const idx = (y * imageData.width + x) * 4;
      const r = imageData.data[idx] ?? 0;
      const g = imageData.data[idx + 1] ?? 0;
      const b = imageData.data[idx + 2] ?? 0;
      for (let dy = y; dy < Math.min(y + size, imageData.height); dy++) {
        for (let dx = x; dx < Math.min(x + size, imageData.width); dx++) {
          const i = (dy * imageData.width + dx) * 4;
          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
        }
      }
    }
  }
};

export interface EditorStampEffectPreviewProps {
  kind: "blur" | "mosaic";
  bgImage: HTMLImageElement;
  /** グループ内での画像 X オフセット（= -(領域X * scaleX)） */
  offsetX: number;
  /** グループ内での画像 Y オフセット（= -(領域Y * scaleY)） */
  offsetY: number;
  /**
   * 親 Group の回転を打ち消し、背景画像がステージ座標と一致するようにする角度（度）
   * 親が rotation=R のとき -R を渡す
   */
  counterRotation?: number;
  stageWidth: number;
  stageHeight: number;
  w: number;
  h: number;
}

/**
 * ぼかし・モザイクのリアルタイムプレビュー
 *
 * 背景画像を領域でクリップし Konva フィルターを適用してエディタ上で表示する。
 */
export function EditorStampEffectPreview({
  kind,
  bgImage,
  offsetX,
  offsetY,
  counterRotation = 0,
  stageWidth,
  stageHeight,
  w,
  h,
}: EditorStampEffectPreviewProps) {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (kind === "blur") {
      group.setAttr("blurRadius", Math.max(4, Math.round(Math.min(w, h) / 8)));
    }
    group.clearCache();
    group.cache({
      x: 0,
      y: 0,
      width: Math.max(1, w),
      height: Math.max(1, h),
      pixelRatio: 1,
    });
    group.getLayer()?.batchDraw();
  }, [kind, bgImage, offsetX, offsetY, counterRotation, stageWidth, stageHeight, w, h]);

  const filters = kind === "blur" ? [Konva.Filters.Blur] : [pixelateFilter];

  return (
    <Group ref={groupRef} clipX={0} clipY={0} clipWidth={w} clipHeight={h} filters={filters}>
      <Group rotation={counterRotation} listening={false}>
        <KonvaImage
          image={bgImage}
          x={offsetX}
          y={offsetY}
          width={stageWidth}
          height={stageHeight}
          listening={false}
        />
      </Group>
    </Group>
  );
}
