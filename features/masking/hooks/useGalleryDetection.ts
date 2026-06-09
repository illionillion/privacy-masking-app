"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { toast } from "sonner";
import type { DetectionPrefs } from "@/lib/preferences";
import {
  applyDetectionFailure,
  applyDetectionSkipped,
  applyDetectionSuccess,
} from "../lib/applyDetectionResult";
import { detectImageContent, shouldSkipAllDetection } from "../lib/detectImageContent";
import {
  getDetectionBatchCompleteMessage,
  getDetectionCompleteMessage,
} from "../lib/detectionMessages";
import { prepareGalleryItemsFromFiles } from "../lib/prepareGalleryItemsFromFiles";
import { runDetectionForGalleryItems } from "../lib/runDetectionForGalleryItems";
import { clearImageEditorSnapshot } from "../lib/imageEditorCache";
import { revokeGalleryItemImageUrls } from "../lib/revokeGalleryItemImageUrls";
import type { MaskingImageItem } from "../types";

/** useGalleryDetection の依存 */
export interface UseGalleryDetectionOptions {
  images: MaskingImageItem[];
  setImages: Dispatch<SetStateAction<MaskingImageItem[]>>;
  setActiveImageId: Dispatch<SetStateAction<string | null>>;
  setEditingImageId: Dispatch<SetStateAction<string | null>>;
  isMountedRef: RefObject<boolean>;
  isModelLoading: boolean;
  isModelError: boolean;
  detectFaces: (imageElement: HTMLImageElement) => Promise<MaskingImageItem["detections"]>;
  recognizeText: (imageElement: HTMLImageElement) => Promise<MaskingImageItem["ocrRegions"]>;
  getDetectionSettings: () => DetectionPrefs;
}

/** useGalleryDetection の戻り値 */
export interface UseGalleryDetectionReturn {
  handleUpload: (files: File[]) => Promise<void>;
  handleRedetect: (imageId: string) => Promise<void>;
}

/**
 * 画像アップロードと再検出のパイプラインを提供する
 *
 * Blob 変換フェーズと検出フェーズを orchestrate し、完了ごとに state を更新する。
 *
 * @param options - ギャラリー state と検出関数
 * @returns handleUpload / handleRedetect
 */
export function useGalleryDetection(
  options: UseGalleryDetectionOptions
): UseGalleryDetectionReturn {
  const {
    images,
    setImages,
    setActiveImageId,
    setEditingImageId,
    isMountedRef,
    isModelLoading,
    isModelError,
    detectFaces,
    recognizeText,
    getDetectionSettings,
  } = options;

  const isMounted = useCallback(() => isMountedRef.current === true, [isMountedRef]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isModelLoading || isModelError) return;

      const uploadedAt = Date.now();
      const { succeededItems, blobResults } = await prepareGalleryItemsFromFiles(
        files,
        uploadedAt,
        isMounted
      );

      if (!isMounted()) {
        revokeGalleryItemImageUrls(succeededItems);
        return;
      }
      if (succeededItems.length > 0) {
        setImages((prev) => [...prev, ...succeededItems]);
        setActiveImageId((prev) => prev ?? succeededItems[0].id);
      }

      if (!isMounted()) return;
      blobResults.forEach((result, idx) => {
        if (result.status === "rejected") {
          toast.error(`${files[idx].name} の読み込みに失敗しました`);
        }
      });
      const blobFailedCount = blobResults.filter((result) => result.status === "rejected").length;
      if (!isMounted()) return;
      if (blobFailedCount > 0) {
        toast.error(`${blobFailedCount} 件の画像の読み込みに失敗しました`);
      }

      const detectionSettings = getDetectionSettings();

      const { detectionSucceededCount, detectionFailedCount } = await runDetectionForGalleryItems({
        items: succeededItems,
        isMounted,
        detectionSettings,
        detectFaces,
        recognizeText,
        onItemSuccess: (item, result) => {
          setImages((prev) =>
            prev.map((image) =>
              image.id === item.id ? applyDetectionSuccess(image, result) : image
            )
          );
          const message = getDetectionCompleteMessage(detectionSettings, item.name, "upload");
          if (message) {
            toast.success(message);
          }
        },
        onItemSkipped: (item) => {
          setImages((prev) =>
            prev.map((image) => (image.id === item.id ? applyDetectionSkipped(image) : image))
          );
          const message = getDetectionCompleteMessage(detectionSettings, item.name, "upload");
          if (message) {
            toast.success(message);
          }
        },
        onItemFailure: (item) => {
          setImages((prev) =>
            prev.map((image) => (image.id === item.id ? applyDetectionFailure(image) : image))
          );
          toast.error(`${item.name} の検出に失敗しました`);
        },
      });

      if (!isMounted()) return;
      const batchMessage = getDetectionBatchCompleteMessage(
        detectionSettings,
        detectionSucceededCount
      );
      if (batchMessage) {
        toast.success(batchMessage);
      }
      if (detectionFailedCount > 0) {
        toast.error(`${detectionFailedCount} 件の検出に失敗しました`);
      }
    },
    [
      detectFaces,
      recognizeText,
      isModelLoading,
      isModelError,
      isMounted,
      setImages,
      setActiveImageId,
      getDetectionSettings,
    ]
  );

  const handleRedetect = useCallback(
    async (imageId: string) => {
      const target = images.find((image) => image.id === imageId);
      if (!target || isModelLoading || isModelError || target.isProcessing) return;

      const detectionSettings = getDetectionSettings();

      if (shouldSkipAllDetection(detectionSettings)) {
        toast.info("顔・テキストの自動検出はオフです。検出設定から有効にできます。");
        return;
      }

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
        const result = await detectImageContent(
          target.imageUrl,
          { detectFaces, recognizeText },
          { detectionSettings }
        );

        if (isMounted()) {
          setImages((prev) =>
            prev.map((image) =>
              image.id === imageId ? applyDetectionSuccess(image, result) : image
            )
          );
          const message = getDetectionCompleteMessage(detectionSettings, target.name, "redetect");
          if (message) {
            toast.success(message);
          }
        }
      } catch (err) {
        if (isMounted()) {
          setImages((prev) =>
            prev.map((image) => (image.id === imageId ? applyDetectionFailure(image) : image))
          );
          const detail = err instanceof Error ? err.message : "不明なエラー";
          toast.error(`${target.name} の再検出に失敗しました: ${detail}`);
        }
      }
    },
    [
      images,
      detectFaces,
      recognizeText,
      isModelLoading,
      isModelError,
      isMounted,
      setImages,
      setEditingImageId,
      getDetectionSettings,
    ]
  );

  return { handleUpload, handleRedetect };
}
