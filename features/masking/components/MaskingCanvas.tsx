"use client";

import { useRef, useCallback, useEffect } from "react";
import type { MouseEvent } from "react";
import clsx from "clsx";
import { MAX_CANVAS_DIMENSION } from "@/lib/canvas";
import type { MaskRegion } from "../types";

export interface MaskingCanvasProps {
  /** 表示する画像のデータURL */
  imageDataUrl: string;
  /** マスキング領域の一覧 */
  regions: MaskRegion[];
  /** 領域クリック時のコールバック（将来の編集UI用） */
  onRegionClick?: (id: string) => void;
}

/**
 * マスキング領域の表示用Canvasコンポーネント
 *
 * 画像を描画し、マスキング領域を重ねて表示する。
 * 将来的な編集UI（ON/OFF切替・手動追加・削除）の受け口。
 */
export function MaskingCanvas({ imageDataUrl, regions, onRegionClick }: MaskingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scaleXRef = useRef(1);
  const scaleYRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      /** 元解像度を基本とし、最大辺が上限を超える場合のみ縮小してCanvas上限超過・メモリ逼迫を防ぐ */
      const requestedScale = Math.min(1, MAX_CANVAS_DIMENSION / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * requestedScale);
      canvas.height = Math.round(img.height * requestedScale);
      /** Math.round後の実寸からスケールを再計算し丸め誤差による座標ズレを防ぐ */
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      scaleXRef.current = scaleX;
      scaleYRef.current = scaleY;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /** マスキング領域を半透明で描画 */
      for (const region of regions) {
        const x = region.x * scaleX;
        const y = region.y * scaleY;
        const w = region.width * scaleX;
        const h = region.height * scaleY;

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

    return () => {
      /** 再描画・アンマウント時に onload を無効化してstale描画を防止 */
      img.onload = null;
    };
  }, [imageDataUrl, regions]);

  /** クリック位置から領域を特定してコールバックを呼ぶ */
  const handleCanvasClick = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!onRegionClick) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      /** 画像読込前は canvas.width/height が 0 のため 0 除算を防ぐ */
      if (canvas.width === 0 || canvas.height === 0) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = scaleXRef.current;
      const scaleY = scaleYRef.current;

      /**
       * CSSによる表示スケールとCanvas縮小率を考慮してクリック位置を元画像の座標系に変換する。
       * cssScaleX = canvas の CSS 表示幅 / canvas の実ピクセル幅
       */
      const cssScaleX = rect.width / canvas.width;
      const cssScaleY = rect.height / canvas.height;
      const clickX = (e.clientX - rect.left) / cssScaleX / scaleX;
      const clickY = (e.clientY - rect.top) / cssScaleY / scaleY;

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
      className={clsx([
        "max-w-full rounded-lg border border-zinc-200 shadow-sm",
        onRegionClick ? "cursor-pointer" : "cursor-default",
      ])}
      onClick={handleCanvasClick}
      aria-label="マスキング表示キャンバス"
    />
  );
}
