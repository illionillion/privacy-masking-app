"use client";

import clsx from "clsx";
import { FaceDetectionCanvas } from "@/features/face-detection";
import { type MaskingImageItem, createDownloadFileName } from "../types";

interface GalleryItemProps {
  image: MaskingImageItem;
  isActive: boolean;
  /** face-api モデルのロード中フラグ（ロード中は再検出を無効化する） */
  isModelLoading: boolean;
  onSelect: (id: string) => void;
  onRedetect: (id: string) => void | Promise<void>;
  onRendered: (id: string, blobUrl: string) => void;
}

/**
 * ギャラリーの個別画像カードコンポーネント
 *
 * isProcessing が true の間は再検出ボタンをこのカード単体で無効化し、
 * 他カードの操作には影響しない。
 * 検出処理中も元画像を表示し（オーバーレイで処理中インジケータを表示）、
 * 検出完了後にマスク結果のオーバーレイを描画する。
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
      aria-current={isActive ? "true" : undefined}
      className={clsx([
        "relative rounded-xl border bg-white p-4 transition-colors",
        "hover:border-blue-200",
        isActive ? "border-blue-300" : "border-zinc-200",
      ])}
    >
      {/*
        カード全体をクリック可能にする見えないボタン。
        ::after で全領域を覆い、再検出・ダウンロードなどのインタラクティブ要素は
        relative + z-10 で前面に出すことで操作可能にする。
      */}
      <button
        type="button"
        aria-label={`${image.name} を選択`}
        onClick={() => onSelect(image.id)}
        className={clsx([
          "absolute inset-0 rounded-xl",
          'after:absolute after:inset-0 after:rounded-xl after:content-[""]',
        ])}
      />
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
            void onRedetect(image.id);
          }}
          disabled={isRedetectDisabled}
          className={clsx([
            "relative z-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
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

      <div className="relative mt-3 flex justify-center overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <FaceDetectionCanvas
          imageDataUrl={image.imageUrl}
          detections={image.detections}
          ocrRegions={image.ocrRegions}
          onRendered={(blobUrl) => {
            onRendered(image.id, blobUrl);
          }}
        />
        {image.isProcessing && (
          <div className="absolute inset-3 flex items-center justify-center rounded-lg bg-white/60 text-sm text-zinc-500">
            処理中…
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">{(image.size / 1024 / 1024).toFixed(2)} MB</p>

        {image.maskedBlobUrl ? (
          <a
            href={image.maskedBlobUrl}
            download={createDownloadFileName(image.name)}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
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
