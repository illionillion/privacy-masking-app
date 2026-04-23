"use client";

import clsx from "clsx";
import { FaceDetectionCanvas } from "@/features/face-detection";
import type { FaceDetectionResult } from "@/features/face-detection";
import type { OcrRegion } from "@/features/ocr";

interface MaskingImageItem {
  id: string;
  name: string;
  size: number;
  imageUrl: string;
  detections: FaceDetectionResult[];
  ocrRegions: OcrRegion[];
  maskedBlobUrl: string | null;
  isProcessing: boolean;
}

interface GalleryItemProps {
  image: MaskingImageItem;
  isActive: boolean;
  /** face-api モデルのロード中フラグ（ロード中は再検出を無効化する） */
  isModelLoading: boolean;
  onSelect: (id: string) => void;
  onRedetect: (id: string) => void;
  onRendered: (id: string, blobUrl: string) => void;
}

/**
 * ダウンロード時のファイル名を生成する
 *
 * @param originalName - 元ファイル名
 * @returns マスク済みファイル名
 */
const createDownloadFileName = (originalName: string): string => {
  const extensionIndex = originalName.lastIndexOf(".");
  if (extensionIndex <= 0) {
    return `${originalName}-masked.png`;
  }
  const basename = originalName.slice(0, extensionIndex);
  return `${basename}-masked.png`;
};

/**
 * ギャラリーの個別画像カードコンポーネント
 *
 * isProcessing が true の間は再検出ボタンをこのカード単体で無効化し、
 * 他カードの操作には影響しない。
 */
export function GalleryItem({
  image,
  isActive,
  isModelLoading,
  onSelect,
  onRedetect,
  onRendered,
}: GalleryItemProps) {
  const isRedetectDisabled = image.isProcessing || isModelLoading;

  return (
    <article
      tabIndex={0}
      onClick={() => onSelect(image.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(image.id);
        }
      }}
      className={clsx([
        "cursor-pointer rounded-xl border bg-white p-4 transition-colors",
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
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRedetect(image.id);
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

      <p className="mt-2 text-xs text-zinc-500">
        {image.isProcessing
          ? "検出中…"
          : `顔: ${image.detections.length} 件 / テキスト: ${image.ocrRegions.length} 件`}
      </p>

      <div className="mt-3 flex justify-center overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        {image.isProcessing ? (
          <div className="flex h-40 w-full items-center justify-center text-sm text-zinc-400">
            処理中…
          </div>
        ) : (
          <FaceDetectionCanvas
            imageDataUrl={image.imageUrl}
            detections={image.detections}
            ocrRegions={image.ocrRegions}
            onRendered={(blobUrl) => {
              onRendered(image.id, blobUrl);
            }}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">{(image.size / 1024 / 1024).toFixed(2)} MB</p>

        {image.maskedBlobUrl ? (
          <a
            href={image.maskedBlobUrl}
            download={createDownloadFileName(image.name)}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            ダウンロード
          </a>
        ) : (
          <span className="text-xs text-zinc-400">描画中…</span>
        )}
      </div>
    </article>
  );
}
