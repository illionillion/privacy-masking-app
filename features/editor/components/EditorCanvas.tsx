"use client";

import { useRef, useCallback, useEffect } from "react";
import type { MaskRegion } from "../types";

interface EditorCanvasProps {
  /** 表示する画像のデータURL */
  imageDataUrl: string;
  /** マスキング領域の一覧 */
  regions: MaskRegion[];
  /** 領域クリック時のコールバック（将来の編集UI用） */
  onRegionClick?: (id: string) => void;
  /** Canvasの最大表示幅 */
  maxWidth?: number;
}

/**
 * マスキング編集用Canvasコンポーネント
 *
 * 画像を描画し、マスキング領域を重ねて表示する。
 * 将来的な編集UI（ON/OFF切替・手動追加・削除）の受け口。
 */
export function EditorCanvas({
  imageDataUrl,
  regions,
  onRegionClick,
  maxWidth = 800,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      scaleRef.current = scale;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /** マスキング領域を半透明で描画 */
      for (const region of regions) {
        const x = region.x * scale;
        const y = region.y * scale;
        const w = region.width * scale;
        const h = region.height * scale;

        if (region.isEnabled) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
        } else {
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(x, y, w, h);
          ctx.setLineDash([]);
        }
      }
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, regions, maxWidth]);

  /** クリック位置から領域を特定してコールバックを呼ぶ */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onRegionClick) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = scaleRef.current;
      const clickX = (e.clientX - rect.left) / scale;
      const clickY = (e.clientY - rect.top) / scale;

      for (const region of regions) {
        if (
          clickX >= region.x &&
          clickX <= region.x + region.width &&
          clickY >= region.y &&
          clickY <= region.y + region.height
        ) {
          onRegionClick(region.id);
          break;
        }
      }
    },
    [regions, onRegionClick]
  );

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full cursor-pointer rounded-lg border border-zinc-200 shadow-sm"
      onClick={handleCanvasClick}
      aria-label="マスキング編集キャンバス"
    />
  );
}
