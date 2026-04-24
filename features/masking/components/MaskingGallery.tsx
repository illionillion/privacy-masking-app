"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { zip } from "fflate";
import { ImageUpload } from "@/components/ImageUpload";
import { useFaceDetection } from "@/features/face-detection";
import { useOcr } from "@/features/ocr";
import { type MaskingImageItem, createDownloadFileName } from "../types";
import { GalleryItem } from "./GalleryItem";

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
 * メインマスキングギャラリーコンポーネント
 *
 * 画像アップロード、顔検出、Canvas表示を統合する。
 */
export function MaskingGallery() {
  const [images, setImages] = useState<MaskingImageItem[]>([]);
  const imagesRef = useRef(images);
  const isMountedRef = useRef(true);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { isModelLoading, isDetecting, error: detectionError, detectFaces } = useFaceDetection();
  const { isRecognizing, error: ocrError, recognizeText } = useOcr();

  /** コンポーネント破棄時に imageUrl の Blob URL をすべて解放し isMountedRef を false にする */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.imageUrl));
    };
  }, []);

  /**
   * ファイルアップロード時の処理
   *
   * 全画像を即座に state に追加して表示したあと、各画像を並行して処理し
   * 完了したものから個別に state を更新する。
   *
   * @param files - アップロードされた画像ファイル一覧
   */
  const handleUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isModelLoading) return;

      setUploadError(null);
      const uploadedAt = Date.now();

      /**
       * Step 1: 全ファイルを ArrayBuffer 経由でメモリ上の Blob に変換し、
       * 変換完了したものから順に state に追加して即時表示する。
       *
       * - File から直接 createObjectURL した URL はモバイルで ERR_UPLOAD_FILE_CHANGED が発生するため
       *   ArrayBuffer 経由で生成する。
       * - allSettled で個別失敗を吸収しつつ、変換完了した画像から setImages して即時プレビューを表示する。
       * - arrayBuffer() は全件同時に走るため、大容量ファイルを多数アップロードする場合は
       *   Step 2 と同様の CONCURRENCY 制限の追加を検討すること。
       */
      const initialItems: MaskingImageItem[] = [];
      const blobResults = await Promise.allSettled(
        files.map(async (file, index) => {
          const buffer = await file.arrayBuffer();
          /** アンマウント後は URL を生成せずに即解放して return */
          if (!isMountedRef.current) return Promise.reject(new Error("unmounted"));
          const memoryBlob = new Blob([buffer], { type: file.type });
          const imageUrl = URL.createObjectURL(memoryBlob);
          /** アンマウントが arrayBuffer 完了後に発生した場合も即解放 */
          if (!isMountedRef.current) {
            URL.revokeObjectURL(imageUrl);
            return Promise.reject(new Error("unmounted"));
          }
          const item: MaskingImageItem = {
            id: `${file.name}-${file.lastModified}-${file.size}-${uploadedAt}-${index}`,
            name: file.name,
            size: file.size,
            imageUrl,
            detections: [],
            ocrRegions: [],
            maskedBlobUrl: null,
            isProcessing: true,
            processingError: false,
          };
          return item;
        })
      );

      /**
       * アップロード順を維持したまま一括 state 追加する。
       * allSettled の結果は files の順序を保持するため、成功分をそのまま追加すれば
       * arrayBuffer 完了順のランダム表示を防げる。
       */
      const succeededItems = blobResults.flatMap((r) =>
        r.status === "fulfilled" ? [r.value] : []
      );
      if (!isMountedRef.current) return;
      if (succeededItems.length > 0) {
        setImages((prev) => {
          const next = [...prev, ...succeededItems];
          imagesRef.current = next;
          return next;
        });
        setActiveImageId((prev) => prev ?? succeededItems[0].id);
      }

      const blobFailedCount = blobResults.filter((r) => r.status === "rejected").length;
      if (!isMountedRef.current) return;
      if (blobFailedCount > 0) {
        setUploadError(`${blobFailedCount} 件の画像の読み込みに失敗しました`);
      }

      initialItems.push(...succeededItems);

      /**
       * Step 2: 並行数を制限しながら各画像を処理し、完了したものから個別に state を更新する。
       *
       * 全画像を同時処理するとモバイルで CPU/メモリが競合して逆に遅くなるため、
       * 同時実行数を CONCURRENCY に抑える。
       */
      const CONCURRENCY = 2;
      const results: PromiseSettledResult<void>[] = [];
      for (let i = 0; i < initialItems.length; i += CONCURRENCY) {
        if (!isMountedRef.current) break;
        const chunk = initialItems.slice(i, i + CONCURRENCY);
        const chunkResults = await Promise.allSettled(
          chunk.map(async (item) => {
            try {
              const imageElement = await loadImageElement(item.imageUrl);

              /** 顔検出とOCRを並行して実行 */
              const [detections, ocrRegions] = await Promise.all([
                detectFaces(imageElement),
                recognizeText(imageElement),
              ]);

              if (isMountedRef.current) {
                setImages((prev) =>
                  prev.map((image) =>
                    image.id === item.id
                      ? { ...image, detections, ocrRegions, isProcessing: false }
                      : image
                  )
                );
              }
            } catch (err) {
              if (isMountedRef.current) {
                setImages((prev) =>
                  prev.map((image) =>
                    image.id === item.id
                      ? { ...image, isProcessing: false, processingError: true }
                      : image
                  )
                );
              }
              throw err;
            }
          })
        );
        results.push(...chunkResults);
      }

      const failedCount = results.filter((r) => r.status === "rejected").length;
      if (!isMountedRef.current) return;
      if (failedCount > 0) {
        setUploadError(`${failedCount} 件の画像の処理に失敗しました`);
      }
    },
    [detectFaces, recognizeText, isModelLoading]
  );

  /**
   * 個別画像を再検出する
   *
   * @param imageId - 再検出対象画像ID
   */
  const handleRedetect = useCallback(
    async (imageId: string) => {
      const target = images.find((image) => image.id === imageId);
      if (!target || isModelLoading || target.isProcessing) return;

      setUploadError(null);
      setImages((prev) =>
        prev.map((image) =>
          image.id === imageId
            ? {
                ...image,
                detections: [],
                ocrRegions: [],
                maskedBlobUrl: null,
                isProcessing: true,
                processingError: false,
              }
            : image
        )
      );
      try {
        const imageElement = await loadImageElement(target.imageUrl);

        /** 顔検出とOCRを並行して実行 */
        const [detections, ocrRegions] = await Promise.all([
          detectFaces(imageElement),
          recognizeText(imageElement),
        ]);

        if (isMountedRef.current) {
          setImages((prev) =>
            prev.map((image) =>
              image.id === imageId
                ? { ...image, detections, ocrRegions, isProcessing: false }
                : image
            )
          );
        }
      } catch (err) {
        if (isMountedRef.current) {
          setImages((prev) =>
            prev.map((image) =>
              image.id === imageId
                ? { ...image, isProcessing: false, processingError: true }
                : image
            )
          );
          const message = err instanceof Error ? err.message : "再検出に失敗しました";
          setUploadError(message);
        }
      }
    },
    [images, detectFaces, recognizeText, isModelLoading]
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
        if (image.id !== imageId || image.maskedBlobUrl === blobUrl || image.processingError) {
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
    const downloadableImages = images.filter(
      (image) => image.maskedBlobUrl !== null && !image.isProcessing
    );
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
          if (isMountedRef.current) {
            setUploadError("ZIPの生成に失敗しました");
          }
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

  const hasProcessingImage = images.some((image) => image.isProcessing);
  const isProcessing = isDetecting || isRecognizing || hasProcessingImage;
  const loadingMessage = isModelLoading ? "顔検出モデルをロード中…" : null;
  const downloadableImagesCount = images.filter(
    (image) => image.maskedBlobUrl && !image.isProcessing
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <ImageUpload
        onUpload={handleUpload}
        disabled={isProcessing || isModelLoading}
        multiple
        loadingMessage={loadingMessage}
      />

      {(detectionError ?? ocrError ?? uploadError) && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          エラー: {detectionError ?? ocrError ?? uploadError}
        </p>
      )}

      {images.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
              <GalleryItem
                key={image.id}
                image={image}
                isActive={image.id === activeImageId}
                isModelLoading={isModelLoading}
                onSelect={setActiveImageId}
                onRedetect={handleRedetect}
                onRendered={handleRendered}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
