"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { zip } from "fflate";
import { ImageUpload } from "@/components/ImageUpload";
import {
  FaceDetectionCanvas,
  useFaceDetection,
  type FaceDetectionResult,
} from "@/features/face-detection";

interface MaskingImageItem {
  id: string;
  name: string;
  size: number;
  /** 表示・検出用 Blob URL（使用後は revokeObjectURL で解放する） */
  imageUrl: string;
  detections: FaceDetectionResult[];
  /** マスキング済み画像の Blob URL（FaceDetectionCanvas の onRendered から渡される） */
  maskedBlobUrl: string | null;
}

/**
 * 画像URLから HTMLImageElement を生成する
 *
 * @param src - 画像の Data URL または Blob URL
 * @returns 読み込み済みのHTMLImageElement
 */
const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
};

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
 * メインマスキングギャラリーコンポーネント
 *
 * 画像アップロード、顔検出、Canvas表示を統合する。
 */
export function MaskingGallery() {
  const [images, setImages] = useState<MaskingImageItem[]>([]);
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { isModelLoading, isDetecting, error: detectionError, detectFaces } = useFaceDetection();

  /** コンポーネント破棄時に imageUrl の Blob URL をすべて解放する */
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.imageUrl));
    };
  }, []);

  /**
   * ファイルアップロード時の処理
   *
   * @param files - アップロードされた画像ファイル一覧
   */
  const handleUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isModelLoading) return;

      setIsBatchProcessing(true);
      setUploadError(null);
      try {
        const uploadedAt = Date.now();

        const settledResults = await Promise.allSettled(
          files.map(async (file, index): Promise<MaskingImageItem> => {
            const imageUrl = URL.createObjectURL(file);
            try {
              const imageElement = await loadImageElement(imageUrl);
              const detections = await detectFaces(imageElement);

              return {
                id: `${file.name}-${file.lastModified}-${file.size}-${uploadedAt}-${index}`,
                name: file.name,
                size: file.size,
                imageUrl,
                detections,
                maskedBlobUrl: null,
              };
            } catch (err) {
              URL.revokeObjectURL(imageUrl);
              throw err;
            }
          })
        );

        const nextImages = settledResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : []
        );
        const failedCount = settledResults.length - nextImages.length;

        if (nextImages.length > 0) {
          setImages((prev) => [...prev, ...nextImages]);
          setActiveImageId((prev) => prev ?? nextImages[0]?.id ?? null);
        }

        if (failedCount > 0) {
          setUploadError(`${failedCount} 件の画像の処理に失敗しました`);
        }
      } finally {
        setIsBatchProcessing(false);
      }
    },
    [detectFaces, isModelLoading]
  );

  /**
   * 個別画像を再検出する
   *
   * @param imageId - 再検出対象画像ID
   */
  const handleRedetect = useCallback(
    async (imageId: string) => {
      const target = images.find((image) => image.id === imageId);
      if (!target || isModelLoading) return;

      try {
        const imageElement = await loadImageElement(target.imageUrl);
        const detections = await detectFaces(imageElement);

        setImages((prev) =>
          prev.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  detections,
                  maskedBlobUrl: null,
                }
              : image
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "再検出に失敗しました";
        setUploadError(message);
      }
    },
    [images, detectFaces, isModelLoading]
  );

  /**
   * Canvas描画後の Blob URL を保持する
   *
   * @param imageId - 対象画像ID
   * @param blobUrl - 描画済み Blob URL
   */
  const handleRendered = useCallback((imageId: string, blobUrl: string) => {
    setImages((prev) =>
      prev.map((image) => {
        if (image.id !== imageId || image.maskedBlobUrl === blobUrl) {
          return image;
        }

        return {
          ...image,
          maskedBlobUrl: blobUrl,
        };
      })
    );
  }, []);

  /** 全画像をクリアする（imageUrl の Blob URL を解放してから state をリセット） */
  const handleClearAll = useCallback(() => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.imageUrl));
    setImages([]);
    setActiveImageId(null);
  }, []);

  /** 描画済み画像をすべてZIPにまとめてダウンロードする */
  const handleDownloadAll = useCallback(() => {
    const downloadableImages = images.filter((image) => image.maskedBlobUrl !== null);
    if (downloadableImages.length === 0) return;

    const fetchAll = downloadableImages.map(async (image) => {
      const res = await fetch(image.maskedBlobUrl as string);
      if (!res.ok) {
        throw new Error(`Failed to fetch masked image: ${image.name}`);
      }
      const buffer = await res.arrayBuffer();
      return { name: createDownloadFileName(image.name), data: new Uint8Array(buffer) };
    });

    void Promise.allSettled(fetchAll).then((results) => {
      const entries = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      );

      if (entries.length === 0) return;

      /** 同名ファイルが複数ある場合に連番サフィックスを付与 */
      const nameCounts = new Map<string, number>();
      const fileMap: Record<string, Uint8Array> = {};

      for (const entry of entries) {
        const count = nameCounts.get(entry.name) ?? 0;
        nameCounts.set(entry.name, count + 1);
        const uniqueName =
          count === 0 ? entry.name : entry.name.replace(/-masked\.png$/, `-masked-${count}.png`);
        fileMap[uniqueName] = entry.data;
      }

      zip(fileMap, (err, data) => {
        if (err) {
          console.error("ZIPの生成に失敗しました", err);
          setUploadError("ZIPの生成に失敗しました");
          return;
        }
        const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "masked-images.zip";
        anchor.click();
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 0);
      });
    });
  }, [images]);

  const isProcessing = isBatchProcessing || isDetecting;
  const loadingMessage = isModelLoading
    ? "顔検出モデルをロード中…"
    : isBatchProcessing
      ? "画像を処理中です。しばらくお待ちください…"
      : null;
  const downloadableImagesCount = images.filter((image) => image.maskedBlobUrl).length;

  return (
    <div className="flex flex-col gap-6">
      <ImageUpload
        onUpload={handleUpload}
        disabled={isProcessing || isModelLoading}
        multiple
        loadingMessage={loadingMessage}
      />

      {(detectionError ?? uploadError) && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          エラー: {detectionError ?? uploadError}
        </p>
      )}

      {images.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">処理済み: {images.length} 枚</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={downloadableImagesCount === 0}
                className={clsx([
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100",
                  downloadableImagesCount === 0 && "cursor-not-allowed opacity-50",
                ])}
              >
                すべてダウンロード
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                すべてクリア
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {images.map((image) => (
              <article
                key={image.id}
                tabIndex={0}
                onClick={() => setActiveImageId(image.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveImageId(image.id);
                  }
                }}
                className={clsx([
                  "cursor-pointer rounded-xl border bg-white p-4 transition-colors",
                  "hover:border-blue-200",
                  image.id === activeImageId ? "border-blue-300" : "border-zinc-200",
                ])}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={clsx([
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      image.id === activeImageId ? "text-blue-700" : "text-zinc-700",
                    ])}
                    title={image.name}
                  >
                    {image.name}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRedetect(image.id);
                    }}
                    disabled={isProcessing || isModelLoading}
                    className={clsx([
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      "bg-blue-600 text-white hover:bg-blue-700",
                      (isProcessing || isModelLoading) && "cursor-not-allowed opacity-50",
                    ])}
                  >
                    再検出
                  </button>
                </div>

                <p className="mt-2 text-xs text-zinc-500">検出結果: {image.detections.length} 件</p>

                <div className="mt-3 flex justify-center overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <FaceDetectionCanvas
                    imageDataUrl={image.imageUrl}
                    detections={image.detections}
                    onRendered={(blobUrl) => {
                      handleRendered(image.id, blobUrl);
                    }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>

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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
