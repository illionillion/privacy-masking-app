"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { exportEditorCanvas } from "@/features/editor/utils/exportCanvas";
import { loadStampImagesCached } from "@/features/editor/lib/loadStampImages";
import { resolveImageEditorSnapshot } from "../lib/resolveImageEditorSnapshot";
import { type MaskingImageItem, createDownloadFileName } from "../types";

interface GalleryItemProps {
  image: MaskingImageItem;
  isActive: boolean;
  /** face-api モデルのロード中フラグ（ロード中は再検出を無効化する） */
  isModelLoading: boolean;
  onSelect: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onRedetect: (id: string) => void | Promise<void>;
  onRendered: (id: string, blobUrl: string) => void;
}

/**
 * ギャラリーの個別画像カードコンポーネント
 *
 * 検出完了後はマスク済みプレビューのみ表示し、編集はモーダルで行う。
 */
export function GalleryItem({
  image,
  isActive,
  isModelLoading,
  onSelect,
  onOpenEdit,
  onRedetect,
  onRendered,
}: GalleryItemProps) {
  const exportedBlobUrlRef = useRef<string | null>(null);
  const prevMaskedBlobUrlForRevokeRef = useRef<string | null>(null);
  const onRenderedRef = useRef(onRendered);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const stampImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const isRedetectDisabled = image.isProcessing || isModelLoading;
  const canEdit = !image.isProcessing && !image.processingError;

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  useEffect(() => {
    void loadStampImagesCached()
      .then((map) => {
        stampImagesRef.current = map;
      })
      .catch((err: unknown) => {
        console.error("スタンプ画像の読み込みに失敗しました", err);
      });
  }, []);

  /** imageUrl が変わったら HTMLImageElement を再生成する */
  useEffect(() => {
    if (!image.imageUrl) return;
    const img = new Image();
    img.onload = () => {
      imageElementRef.current = img;
    };
    img.src = image.imageUrl;
  }, [image.imageUrl]);

  /**
   * キャッシュ上のエディタ状態からプレビュー用マスクをエクスポートする
   */
  useEffect(() => {
    if (!imageElementRef.current || image.isProcessing || image.processingError) return;
    const snapshot = resolveImageEditorSnapshot(image);
    let cancelled = false;

    void exportEditorCanvas(
      imageElementRef.current,
      snapshot.stampRegions,
      snapshot.paintStrokes,
      stampImagesRef.current
    )
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        exportedBlobUrlRef.current = blobUrl;
        onRenderedRef.current(image.id, blobUrl);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error("エクスポートに失敗しました", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    image.id,
    image.isProcessing,
    image.processingError,
    image.detections,
    image.ocrRegions,
    image,
  ]);

  /**
   * マスク結果 Blob URL の解放
   */
  useEffect(() => {
    const current = image.maskedBlobUrl;
    const prev = prevMaskedBlobUrlForRevokeRef.current;
    if (prev !== null && prev !== current && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
      if (exportedBlobUrlRef.current === prev) {
        exportedBlobUrlRef.current = null;
      }
    }
    prevMaskedBlobUrlForRevokeRef.current = current;
  }, [image.maskedBlobUrl]);

  useEffect(() => {
    return () => {
      if (exportedBlobUrlRef.current) {
        URL.revokeObjectURL(exportedBlobUrlRef.current);
        exportedBlobUrlRef.current = null;
      }
    };
  }, []);

  return (
    <article
      aria-current={isActive ? "true" : undefined}
      className={clsx([
        "relative isolate min-w-0 rounded-xl border bg-white p-4 transition-colors",
        "hover:border-blue-200",
        isActive ? "border-blue-300" : "border-zinc-200",
      ])}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={clsx([
            "min-w-0 flex-1 truncate text-sm font-medium",
            isActive ? "text-blue-700" : "text-zinc-700",
          ])}
          title={image.name}
        >
          {image.name}
        </p>
        <div className="relative z-10 flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              aria-label={`${image.name} を編集`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(image.id);
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              編集
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void onRedetect(image.id);
            }}
            disabled={isRedetectDisabled}
            className={clsx([
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "bg-blue-600 text-white hover:bg-blue-700",
              isRedetectDisabled && "cursor-not-allowed opacity-50",
            ])}
          >
            再検出
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        {image.isProcessing
          ? "検出中…"
          : image.processingError
            ? "検出に失敗しました"
            : `顔: ${image.detections.length} 件 / テキスト: ${image.ocrRegions.length} 件`}
      </p>

      <div className="relative mt-3 rounded-xl border border-zinc-200 bg-zinc-50">
        {image.isProcessing ? (
          <div className="flex justify-center p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.imageUrl}
              alt={image.name}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        ) : image.processingError ? (
          <div className="flex justify-center p-3">
            <p className="text-sm text-red-500">検出に失敗しました。再検出してください。</p>
          </div>
        ) : (
          <button
            type="button"
            className="relative z-10 flex w-full justify-center p-2"
            aria-label={`${image.name} のプレビューを編集`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit(image.id);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.maskedBlobUrl ?? image.imageUrl}
              alt={image.name}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </button>
        )}

        {image.isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 text-sm text-zinc-500">
            処理中…
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">{(image.size / 1024 / 1024).toFixed(2)} MB</p>

        <div className="flex items-center gap-2">
          {image.maskedBlobUrl && !image.isProcessing && !image.processingError ? (
            <a
              href={image.maskedBlobUrl}
              download={createDownloadFileName(image.name)}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              ダウンロード
            </a>
          ) : (
            <span
              className={clsx([
                "text-xs",
                image.processingError ? "text-red-500" : "text-zinc-400",
              ])}
            >
              {image.isProcessing ? "処理中…" : image.processingError ? "検出失敗" : "描画中…"}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={`${image.name} を選択`}
        onClick={() => onSelect(image.id)}
        className="absolute inset-0 z-0 rounded-xl"
      />
    </article>
  );
}
