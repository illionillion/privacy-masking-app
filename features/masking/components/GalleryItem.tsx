"use client";

import clsx from "clsx";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import { EditorToolbar } from "@/features/editor/components/EditorToolbar";
import { exportEditorCanvas } from "@/features/editor/utils/exportCanvas";
import { type MaskingImageItem, createDownloadFileName } from "../types";

/** Konva は window を module ロード時に参照するため SSR を無効化して動的インポートする */
const EditorCanvas = dynamic(
  () => import("@/features/editor/components/EditorCanvas").then((mod) => mod.EditorCanvas),
  { ssr: false }
);

interface GalleryItemProps {
  image: MaskingImageItem;
  isActive: boolean;
  /** face-api モデルのロード中フラグ（ロード中は再検出を無効化する） */
  isModelLoading: boolean;
  onSelect: (id: string) => void;
  onRedetect: (id: string) => void | Promise<void>;
  onRendered: (id: string, blobUrl: string) => void;
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

/**
 * スタンプ画像を読み込み Map に格納する
 *
 * @returns ファイル名をキーにした HTMLImageElement の Map
 */
async function loadStampImages(): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>();
  await Promise.allSettled(
    STAMP_FILE_NAMES.map(
      (fileName) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            map.set(fileName, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `${PUBLIC_BASE_PATH}/stamps/${fileName}`;
        })
    )
  );
  return map;
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

  const editor = useEditorState();
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState(0);
  const [imageNaturalHeight, setImageNaturalHeight] = useState(0);
  const [stampImages, setStampImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const exportedBlobUrlRef = useRef<string | null>(null);
  const onRenderedRef = useRef(onRendered);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

  /** スタンプ画像を一度だけ読み込む */
  useEffect(() => {
    void loadStampImages()
      .then(setStampImages)
      .catch((err: unknown) => {
        console.error("スタンプ画像の読み込みに失敗しました", err);
      });
  }, []);

  /** imageUrl が変わったら HTMLImageElement を再生成する */
  useEffect(() => {
    if (!image.imageUrl) return;
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageNaturalWidth(img.naturalWidth);
      setImageNaturalHeight(img.naturalHeight);
    };
    img.src = image.imageUrl;
  }, [image.imageUrl]);

  /** detections/ocrRegions が更新されたらエディタ状態を初期化する */
  useEffect(() => {
    if (image.isProcessing) return;
    editor.initFromDetections(image.detections, image.ocrRegions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.detections, image.ocrRegions, image.isProcessing]);

  /**
   * エディタ状態の変化に応じて自動エクスポートを行い onRendered に通知する
   */
  useEffect(() => {
    if (!imageElement || image.isProcessing) return;
    let cancelled = false;

    void exportEditorCanvas(
      imageElement,
      editor.stampRegions,
      editor.fillRegions,
      editor.paintStrokes,
      stampImages
    )
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        const prev = exportedBlobUrlRef.current;
        exportedBlobUrlRef.current = blobUrl;
        onRenderedRef.current(image.id, blobUrl);
        if (prev) URL.revokeObjectURL(prev);
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
    imageElement,
    image.id,
    image.isProcessing,
    editor.stampRegions,
    editor.fillRegions,
    editor.paintStrokes,
    stampImages,
  ]);

  /** アンマウント時に Blob URL を解放する */
  useEffect(() => {
    return () => {
      if (exportedBlobUrlRef.current) {
        URL.revokeObjectURL(exportedBlobUrlRef.current);
        exportedBlobUrlRef.current = null;
      }
    };
  }, []);

  /** 手動エクスポートボタンの処理 */
  const handleExport = useCallback(() => {
    if (!imageElement) return;
    void exportEditorCanvas(
      imageElement,
      editor.stampRegions,
      editor.fillRegions,
      editor.paintStrokes,
      stampImages
    )
      .then((blobUrl) => {
        const prev = exportedBlobUrlRef.current;
        exportedBlobUrlRef.current = blobUrl;
        onRenderedRef.current(image.id, blobUrl);
        if (prev) URL.revokeObjectURL(prev);
      })
      .catch((err: unknown) => {
        console.error("エクスポートに失敗しました", err);
      });
  }, [
    imageElement,
    editor.stampRegions,
    editor.fillRegions,
    editor.paintStrokes,
    stampImages,
    image.id,
  ]);

  return (
    <article
      aria-current={isActive ? "true" : undefined}
      className={clsx([
        "relative isolate rounded-xl border bg-white p-4 transition-colors",
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
          : image.processingError
            ? "検出に失敗しました"
            : `顔: ${image.detections.length} 件 / テキスト: ${image.ocrRegions.length} 件`}
      </p>

      {/* エディタUI */}
      <div className="relative mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
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
          <>
            <div className="p-2">
              <EditorToolbar
                mode={editor.mode}
                rectTarget={editor.rectTarget}
                selectedStampType={editor.selectedStampType}
                brushSize={editor.brushSize}
                selectedId={editor.selectedId}
                onModeChange={editor.setMode}
                onRectTargetChange={editor.setRectTarget}
                onStampTypeChange={editor.setSelectedStampType}
                onBrushSizeChange={editor.setBrushSize}
                onDeleteSelected={editor.removeSelectedItem}
              />
            </div>

            <div className="px-2 pb-2">
              {imageNaturalWidth > 0 && imageNaturalHeight > 0 && (
                <EditorCanvas
                  imageUrl={image.imageUrl}
                  imageNaturalWidth={imageNaturalWidth}
                  imageNaturalHeight={imageNaturalHeight}
                  stampRegions={editor.stampRegions}
                  fillRegions={editor.fillRegions}
                  paintStrokes={editor.paintStrokes}
                  selectedId={editor.selectedId}
                  mode={editor.mode}
                  selectedStampType={editor.selectedStampType}
                  rectTarget={editor.rectTarget}
                  brushSize={editor.brushSize}
                  onSelectItem={editor.selectItem}
                  onAddStampRegion={editor.addStampRegion}
                  onAddFillRegion={editor.addFillRegion}
                  onAddPaintStroke={editor.addPaintStroke}
                  onUpdateStampRegion={editor.updateStampRegion}
                  onUpdateFillRegion={editor.updateFillRegion}
                />
              )}
            </div>
          </>
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleExport();
            }}
            disabled={!imageElement || image.processingError}
            className={clsx([
              "relative z-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "bg-emerald-600 text-white hover:bg-emerald-700",
              (!imageElement || image.processingError) && "cursor-not-allowed opacity-50",
            ])}
          >
            エクスポート
          </button>

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
      {/*
        カード全体をクリック可能にする見えないボタン。
        DOM の最後に配置しつつ z-0 を付けることで、カード全域のクリックを受け取る
        ベースレイヤーとして扱う。
        再検出・ダウンロードなどのインタラクティブ要素は relative z-10 で
        このボタンより前面に出して操作できるようにする。
      */}
      <button
        type="button"
        aria-label={`${image.name} を選択`}
        onClick={() => onSelect(image.id)}
        className="absolute inset-0 z-0 rounded-xl"
      />
    </article>
  );
}

