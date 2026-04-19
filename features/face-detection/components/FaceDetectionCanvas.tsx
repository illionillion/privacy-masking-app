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
  /** 描画完了時のデータURL通知 */
  onRendered?: (dataUrl: string) => void;
}

/** スタンプ画像のパス一覧 */
const STAMP_PATHS = [
  "/stamps/beaming_face_with_smiling_eyes-64.png",
  "/stamps/face_with_tears_of_joy-64.png",
  "/stamps/grinning_face-64.png",
  "/stamps/grinning_face_with_big_eyes-64.png",
  "/stamps/grinning_face_with_smiling_eyes-64.png",
  "/stamps/grinning_squinting_face-64.png",
  "/stamps/rolling_on_the_floor_laughing-64.png",
  "/stamps/smiling_face_with_halo-64.png",
  "/stamps/smiling_face_with_hearts-64.png",
  "/stamps/smiling_face_with_smiling_eyes-64.png",
  "/stamps/winking_face-64.png",
];

/**
 * 顔検出結果を表示するCanvasコンポーネント
 *
 * アップロードされた画像を描画し、検出された顔の領域に
 * ランダムに選ばれたスタンプ画像を重ねて表示する。
 */
export function FaceDetectionCanvas({
  imageDataUrl,
  detections,
  maxWidth = 800,
  onRendered,
}: FaceDetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onRenderedRef = useRef(onRendered);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  useEffect(() => {
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      if (isCancelled) return;
      /** 表示スケールを計算 */
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /** スタンプ画像を全て先読みしてから各顔領域にランダム描画 */
      const stampPromises = STAMP_PATHS.map((src) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const si = new Image();
          si.onload = () => resolve(si);
          si.onerror = reject;
          si.src = src;
        });
      });

      void Promise.all(stampPromises)
        .then((stamps) => {
          if (isCancelled) return;
          for (const det of detections) {
            const cx = (det.x + det.width / 2) * scale;
            const cy = (det.y + det.height / 2) * scale;
            const size = Math.max(det.width, det.height) * scale;
            const stamp = stamps[Math.floor(Math.random() * stamps.length)];
            ctx.drawImage(stamp, cx - size / 2, cy - size / 2, size, size);
          }

          onRenderedRef.current?.(canvas.toDataURL("image/png"));
        })
        .catch(() => {
          if (isCancelled) return;
          onRenderedRef.current?.(canvas.toDataURL("image/png"));
        });
    };
    img.src = imageDataUrl;

    return () => {
      isCancelled = true;
    };
  }, [imageDataUrl, detections, maxWidth]);

  return (
    <canvas
      ref={canvasRef}
      className="h-auto max-w-full rounded-lg border border-zinc-200 shadow-sm"
    />
  );
}
