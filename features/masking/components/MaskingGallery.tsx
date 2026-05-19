"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { zip } from "fflate";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_FILE_SIZE } from "@/components/ImageUpload/constants";
import { useFaceDetection } from "@/features/face-detection";
import { useOcr } from "@/features/ocr";
import { loadStampImagesCached } from "@/features/editor/lib/loadStampImages";
import { useConfirmStore } from "@/lib/confirmStore";
import { clearAllImageEditorSnapshots, clearImageEditorSnapshot } from "../lib/imageEditorCache";
import { type MaskingImageItem, createDownloadFileName } from "../types";
import { EditorModal } from "./EditorModal";
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
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [stampImages, setStampImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const imagesRef = useRef(images);
  const isMountedRef = useRef(true);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    let cancelled = false;
    void loadStampImagesCached()
      .then((map) => {
        if (!cancelled) setStampImages(map);
      })
      .catch((err: unknown) => {
        if (!cancelled) console.error("スタンプ画像の読み込みに失敗しました", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenEdit = useCallback((imageId: string) => {
    const target = imagesRef.current.find((image) => image.id === imageId);
    if (!target || target.isProcessing || target.processingError) return;
    setEditingImageId(imageId);
    setActiveImageId(imageId);
  }, []);
  const { isModelLoading, isModelError, isDetecting, detectFaces } = useFaceDetection();
  const { isRecognizing, recognizeText } = useOcr();

  /** コンポーネント破棄時に imageUrl の Blob URL をすべて解放し isMountedRef を false にする */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.imageUrl);
        if (image.maskedBlobUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(image.maskedBlobUrl);
        }
      });
      clearAllImageEditorSnapshots();
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
      if (files.length === 0 || isModelLoading || isModelError) return;

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

      if (!isMountedRef.current) return;
      blobResults.forEach((result, idx) => {
        if (result.status === "rejected") {
          toast.error(`${files[idx].name} の読み込みに失敗しました`);
        }
      });
      const blobFailedCount = blobResults.filter((r) => r.status === "rejected").length;
      if (!isMountedRef.current) return;
      if (blobFailedCount > 0) {
        toast.error(`${blobFailedCount} 件の画像の読み込みに失敗しました`);
      }

      initialItems.push(...succeededItems);

      /**
       * Step 2: 並行数を制限しながら各画像を処理し、完了したものから個別に state を更新する。
       *
       * 全画像を同時処理するとモバイルで CPU/メモリが競合して逆に遅くなるため、
       * 同時実行数を CONCURRENCY に抑える。
       */
      const CONCURRENCY = 2;
      let step2SucceededCount = 0;
      let step2FailedCount = 0;
      for (let i = 0; i < initialItems.length; i += CONCURRENCY) {
        if (!isMountedRef.current) break;
        const chunk = initialItems.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
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
                toast.success(`${item.name} の検出が完了しました`);
                step2SucceededCount++;
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
                toast.error(`${item.name} の検出に失敗しました`);
                step2FailedCount++;
              }
              throw err;
            }
          })
        );
      }
      if (!isMountedRef.current) return;
      if (step2SucceededCount > 0) {
        toast.success(`${step2SucceededCount} 件の検出が完了しました`);
      }
      if (step2FailedCount > 0) {
        toast.error(`${step2FailedCount} 件の検出に失敗しました`);
      }
    },
    [detectFaces, recognizeText, isModelLoading, isModelError]
  );

  /**
   * ページ全体の paste イベントをリッスンし、クリップボードの画像を handleUpload へ渡す
   *
   * - モデル未ロード・エラー時は何もしない
   * - クリップボードに画像がない場合も何もしない
   * - ImageUpload と同じ基準（JPEG/PNG/WebP/GIF・20MB以下）でバリデーションを行う
   * - 貼り付け成功時にトースト通知を表示する
   */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isModelLoading || isModelError) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const validFiles: File[] = [];
      let validationError: string | null = null;

      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          validationError = "JPEG / PNG / WebP / GIF 形式の画像を選択してください";
          continue;
        }
        if (file.size > MAX_IMAGE_FILE_SIZE) {
          validationError = "ファイルサイズは20MB以下にしてください";
          continue;
        }
        validFiles.push(file);
      }

      /** ImageUpload と同じ挙動: 有効ファイルがあればアップロードのみ、なければエラー表示 */
      if (validFiles.length > 0) {
        toast.info("画像を貼り付けました");
        void handleUpload(validFiles);
        return;
      }

      if (validationError) {
        toast.error(validationError);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleUpload, isModelLoading, isModelError]);

  /**
   * 個別画像を再検出する
   *
   * @param imageId - 再検出対象画像ID
   */
  const handleRedetect = useCallback(
    async (imageId: string) => {
      const target = images.find((image) => image.id === imageId);
      if (!target || isModelLoading || isModelError || target.isProcessing) return;

      clearImageEditorSnapshot(imageId);
      setEditingImageId((current) => (current === imageId ? null : current));

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
          toast.success(`${target.name} の再検出が完了しました`);
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
          const detail = err instanceof Error ? err.message : "不明なエラー";
          toast.error(`${target.name} の再検出に失敗しました: ${detail}`);
        }
      }
    },
    [images, detectFaces, recognizeText, isModelLoading, isModelError]
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

  /** 全画像をクリアする（確認ダイアログ表示後、OK の場合のみ Blob URL を解放して state をリセット） */
  const handleClearAll = useCallback(async () => {
    try {
      const ok = await useConfirmStore.getState().open("すべての画像と編集内容をクリアしますか？");
      if (!ok) return;
      if (!isMountedRef.current) return;
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.imageUrl));
      clearAllImageEditorSnapshots();
      setImages([]);
      setActiveImageId(null);
      setEditingImageId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "クリアに失敗しました";
      toast.error(message);
    }
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
            toast.error("ZIPの生成に失敗しました");
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
  const editingImage = editingImageId
    ? images.find((image) => image.id === editingImageId)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <ImageUpload
        onUpload={handleUpload}
        disabled={isProcessing || isModelLoading || isModelError}
        multiple
        loadingMessage={loadingMessage}
      />
      {isModelError && (
        <p role="alert" className="text-center text-sm text-red-600">
          顔検出モデルのロードに失敗しました。ページを再読み込みしてください。
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
                onClick={() => void handleClearAll()}
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
                stampImages={stampImages}
                onSelect={setActiveImageId}
                onOpenEdit={handleOpenEdit}
                onRedetect={handleRedetect}
                onRendered={handleRendered}
              />
            ))}
          </div>
        </div>
      )}

      {editingImage && (
        <EditorModal
          image={editingImage}
          stampImages={stampImages}
          onClose={() => setEditingImageId(null)}
          onRendered={handleRendered}
        />
      )}
    </div>
  );
}
