"use client";

import { useEffect, useRef } from "react";
import { MAX_CANVAS_DIMENSION } from "@/lib/canvas";
import type { FaceDetectionResult } from "../types";

/** OCR検出領域の最小構造型。features/ocr に依存せず最小限の位置情報のみ保持する */
interface MaskRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FaceDetectionCanvasProps {
  /** 表示する画像のデータURL */
  imageDataUrl: string;
  /** 検出された顔の矩形一覧 */
  detections: FaceDetectionResult[];
  /** OCRで検出された個人情報領域（黒塗りで描画） */
  ocrRegions?: MaskRegion[];
  /**
   * 描画完了時のBlob URL通知。
   * Blob URLの解放はこのコンポーネントが管理するため、呼び出し元での revokeObjectURL は不要。
   */
  onRendered?: (blobUrl: string) => void;
}

/** OCR検出領域のマスキングカラー（黒塗り） */
const OCR_MASK_COLOR = "#000000";

/** props 未指定時に使う空の OCR 領域配列（参照を安定させ不要な再描画を防ぐ） */
const EMPTY_OCR_REGIONS: MaskRegion[] = [];

/** 公開URLのベースパス。サブパス配信時は `NEXT_PUBLIC_BASE_PATH` を設定する。 */
const PUBLIC_BASE_PATH = (() => {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (raw === "/" || raw.length === 0) return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
})();

/** スタンプ画像のファイル名一覧 */
const STAMP_FILE_NAMES = [
  "beaming_face_with_smiling_eyes-64.png",
  "face_with_tears_of_joy-64.png",
  "grinning_face-64.png",
  "grinning_face_with_big_eyes-64.png",
  "grinning_face_with_smiling_eyes-64.png",
  "grinning_squinting_face-64.png",
  "rolling_on_the_floor_laughing-64.png",
  "smiling_face_with_halo-64.png",
  "smiling_face_with_hearts-64.png",
  "smiling_face_with_smiling_eyes-64.png",
  "winking_face-64.png",
];

/** スタンプ画像のパス一覧 */
const STAMP_PATHS = STAMP_FILE_NAMES.map((fileName) => `${PUBLIC_BASE_PATH}/stamps/${fileName}`);

/** モジュールスコープのスタンプ画像キャッシュ（初回ロード後は再利用） */
const stampImageCache = new Map<string, Promise<HTMLImageElement>>();

/**
 * スタンプ画像を読み込む。キャッシュ済みの場合はキャッシュから返す。
 *
 * 一時的な読み込み失敗時に reject 済み Promise を再利用し続けないよう、
 * 失敗したキャッシュエントリは削除して次回呼び出しで再試行できるようにする。
 */
function loadStampImage(src: string): Promise<HTMLImageElement> {
  const cached = stampImageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load stamp image: ${src}`));
    img.src = src;
  }).catch((error: unknown) => {
    stampImageCache.delete(src);
    throw error;
  });

  stampImageCache.set(src, promise);
  return promise;
}

/**
 * 顔検出結果を表示するCanvasコンポーネント
 *
 * アップロードされた画像を描画し、検出された顔の領域に
 * ランダムに選ばれたスタンプ画像を重ねて表示する。
 */
export function FaceDetectionCanvas({
  imageDataUrl,
  detections,
  ocrRegions = EMPTY_OCR_REGIONS,
  onRendered,
}: FaceDetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onRenderedRef = useRef(onRendered);
  /** 現在のBlob URLを保持（再描画・アンマウント時に解放するため管理） */
  const blobUrlRef = useRef<string | null>(null);

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
      /** 元解像度を基本とし、最大辺が上限を超える場合のみ縮小してCanvas上限超過・メモリ逼迫を防ぐ */
      const requestedScale = Math.min(1, MAX_CANVAS_DIMENSION / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * requestedScale);
      canvas.height = Math.round(img.height * requestedScale);
      /** Math.round後の実寸からスケールを再計算し丸め誤差による座標ズレを防ぐ */
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /** スタンプ画像を全て読み込み（失敗したものは個別にフォールバック） */
      void Promise.allSettled(STAMP_PATHS.map(loadStampImage)).then((results) => {
        if (isCancelled) return;

        const availableStamps = results
          .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === "fulfilled")
          .map((r) => r.value);

        for (const det of detections) {
          const centerX = (det.x + det.width / 2) * scaleX;
          const centerY = (det.y + det.height / 2) * scaleY;
          const stampSize = Math.max(det.width * scaleX, det.height * scaleY);

          if (availableStamps.length > 0) {
            const stamp = availableStamps[Math.floor(Math.random() * availableStamps.length)];
            ctx.drawImage(
              stamp,
              centerX - stampSize / 2,
              centerY - stampSize / 2,
              stampSize,
              stampSize
            );
          } else {
            /** スタンプが全滅した場合のフォールバック: 半透明の黒矩形でマスキング */
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(centerX - stampSize / 2, centerY - stampSize / 2, stampSize, stampSize);
          }
        }

        /** OCR検出領域を黒塗りでマスキング */
        ctx.fillStyle = OCR_MASK_COLOR;
        for (const region of ocrRegions) {
          ctx.fillRect(
            region.x * scaleX,
            region.y * scaleY,
            region.width * scaleX,
            region.height * scaleY
          );
        }

        /** toDataURL の代わりに toBlob を使用してメインスレッドのブロックを回避 */
        canvas.toBlob((blob) => {
          if (isCancelled || !blob) return;
          /** 新しいURLを生成・通知してから前回のBlob URLを解放（親が常に有効なURLを参照できるよう） */
          const url = URL.createObjectURL(blob);
          const prevUrl = blobUrlRef.current;
          blobUrlRef.current = url;
          onRenderedRef.current?.(url);
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
        }, "image/png");
      });
    };
    img.src = imageDataUrl;

    return () => {
      isCancelled = true;
      /** 再描画・アンマウント時にBlob URLを解放 */
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [imageDataUrl, detections, ocrRegions]);

  return (
    <canvas
      ref={canvasRef}
      className="h-auto max-w-full rounded-lg border border-zinc-200 shadow-sm"
    />
  );
}
