"use client";

import { useEffect, useRef } from "react";
import type { FaceDetectionResult } from "../types";

interface FaceDetectionCanvasProps {
  /** 表示する画像のデータURL */
  imageDataUrl: string;
  /** 検出された顔の矩形一覧 */
  detections: FaceDetectionResult[];
  /** Canvasの最大表示幅 */
  maxWidth?: number;
}

/**
 * 顔検出結果を表示するCanvasコンポーネント
 *
 * アップロードされた画像を描画し、検出された顔の領域に
 * 緑色の矩形を重ねて表示する。
 */
export function FaceDetectionCanvas({
  imageDataUrl,
  detections,
  maxWidth = 800,
}: FaceDetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      /** 表示スケールを計算 */
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /** 検出矩形を描画 */
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = Math.max(2, scale * 2);
      ctx.font = `${Math.max(12, scale * 14)}px sans-serif`;
      ctx.fillStyle = "#22c55e";

      for (const det of detections) {
        const x = det.x * scale;
        const y = det.y * scale;
        const w = det.width * scale;
        const h = det.height * scale;

        ctx.strokeRect(x, y, w, h);

        /** スコアラベルを描画 */
        const label = `${Math.round(det.score * 100)}%`;
        ctx.fillText(label, x + 2, y > 16 ? y - 4 : y + h + 16);
      }
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, detections, maxWidth]);

  return (
    <canvas ref={canvasRef} className="max-w-full rounded-lg border border-zinc-200 shadow-sm" />
  );
}
