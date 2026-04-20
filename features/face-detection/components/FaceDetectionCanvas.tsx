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
  /**
   * 描画完了時のBlob URL通知。
   * Blob URLの解放はこのコンポーネントが管理するため、呼び出し元での revokeObjectURL は不要。
   */
  onRendered?: (blobUrl: string) => void;
}

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
  maxWidth = 800,
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
      /** 表示スケールを計算 */
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      /** スタンプ画像を全て読み込み（失敗したものは個別にフォールバック） */
      void Promise.allSettled(STAMP_PATHS.map(loadStampImage)).then((results) => {
        if (isCancelled) return;

        const availableStamps = results
          .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === "fulfilled")
          .map((r) => r.value);

        for (const det of detections) {
          const cx = (det.x + det.width / 2) * scale;
          const cy = (det.y + det.height / 2) * scale;
          const size = Math.max(det.width, det.height) * scale;

          if (availableStamps.length > 0) {
            const stamp = availableStamps[Math.floor(Math.random() * availableStamps.length)];
            ctx.drawImage(stamp, cx - size / 2, cy - size / 2, size, size);
          } else {
            /** スタンプが全滅した場合のフォールバック: 半透明の黒矩形でマスキング */
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
          }
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
  }, [imageDataUrl, detections, maxWidth]);

  return (
    <canvas
      ref={canvasRef}
      className="h-auto max-w-full rounded-lg border border-zinc-200 shadow-sm"
    />
  );
}
