"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ImageUpload } from "@/components/ImageUpload";
import { FaceDetectionCanvas, useFaceDetection } from "@/features/face-detection";
import { useEditor } from "@/features/editor";

/**
 * メインマスキングエディターコンポーネント
 *
 * 画像アップロード、顔検出、Canvas表示を統合する。
 * 将来的な編集UI（手動追加・削除・ON/OFF切替）の受け口となる。
 */
export function MaskingEditor() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const {
    isModelLoading,
    isDetecting,
    detections,
    error: detectionError,
    detectFaces,
  } = useFaceDetection();
  const { setRegions, resetRegions } = useEditor();

  /** ファイルアップロード時の処理 */
  const handleUpload = useCallback((file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  /** 画像ロード完了後、自動で顔検出を実行 */
  useEffect(() => {
    if (!imageDataUrl || isModelLoading) return;

    const img = new Image();
    img.onload = async () => {
      imgRef.current = img;
      await detectFaces(img);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, isModelLoading, detectFaces]);

  /** 検出結果をエディター領域に一括登録 */
  useEffect(() => {
    setRegions(
      detections.map((det) => ({
        x: det.x,
        y: det.y,
        width: det.width,
        height: det.height,
        type: "face" as const,
      }))
    );
  }, [detections, setRegions]);

  /** 再検出ボタン */
  const handleRedetect = useCallback(async () => {
    if (imgRef.current) {
      await detectFaces(imgRef.current);
    }
  }, [detectFaces]);

  return (
    <div className="flex flex-col gap-6">
      {/* ステータスバー */}
      {isModelLoading && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700"
        >
          <span className="animate-spin" aria-hidden="true">
            ⏳
          </span>
          <span>顔検出モデルをロード中…</span>
        </div>
      )}

      {/* 画像アップロード（未選択時のみ表示） */}
      {!imageDataUrl && <ImageUpload onUpload={handleUpload} disabled={isModelLoading} />}

      {/* Canvas表示エリア */}
      {imageDataUrl && (
        <div className="flex flex-col gap-4">
          {/* ツールバー */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {isDetecting ? (
                <span className="flex items-center gap-1">
                  <span className="animate-spin" aria-hidden="true">
                    🔍
                  </span>
                  顔を検出中…
                </span>
              ) : (
                `検出結果: ${detections.length} 件の顔を検出`
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRedetect}
                disabled={isDetecting || isModelLoading}
                className={clsx([
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  (isDetecting || isModelLoading) && "cursor-not-allowed opacity-50",
                ])}
              >
                再検出
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageDataUrl(null);
                  setImageFile(null);
                  resetRegions();
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                別の画像を選択
              </button>
            </div>
          </div>

          {/* エラー表示 */}
          {detectionError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              エラー: {detectionError}
            </p>
          )}

          {/* Canvas */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-2">
            <FaceDetectionCanvas imageDataUrl={imageDataUrl} detections={detections} />
          </div>

          {/* ファイル情報 */}
          {imageFile && (
            <p className="text-xs text-zinc-400">
              {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
