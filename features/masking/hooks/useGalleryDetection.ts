"use client";

import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { toast } from "sonner";
import type { DetectionPrefs } from "@/lib/preferences";
import {
  applyDetectionFailure,
  applyDetectionSkipped,
  applyDetectionSuccess,
} from "../lib/applyDetectionResult";
import {
  getEffectiveDetectionSettings,
  isUploadBlockedByModelState,
  OFFLINE_REDETECT_MESSAGE,
} from "../lib/offlineManualEdit";
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
  recognizeText: (
    imageElement: HTMLImageElement,
    options?: { customMaskTerms?: readonly string[] }
  ) => Promise<MaskingImageItem["ocrRegions"]>;
  getDetectionSettings: () => DetectionPrefs;
  getCustomMaskTerms: () => readonly string[];
  /** オフライン手動編集モードか */
  isOffline: boolean;
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
    getCustomMaskTerms,
    isOffline,
  } = options;

  const isMounted = useCallback(() => isMountedRef.current === true, [isMountedRef]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      if (
        files.length === 0 ||
        isUploadBlockedByModelState(isOffline, isModelLoading, isModelError)
      ) {
        return;
      }

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

      const detectionSettings = getEffectiveDetectionSettings(getDetectionSettings(), isOffline);
      const customMaskTerms = getCustomMaskTerms();

      const { detectionSucceededCount, detectionFailedCount } = await runDetectionForGalleryItems({
        items: succeededItems,
        isMounted,
        detectionSettings,
        customMaskTerms,
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
      isOffline,
      isModelLoading,
      isModelError,
      isMounted,
      setImages,
      setActiveImageId,
      getDetectionSettings,
      getCustomMaskTerms,
    ]
  );

  const handleRedetect = useCallback(
    async (imageId: string) => {
      const target = images.find((image) => image.id === imageId);
      if (!target || target.isProcessing) return;

      if (isOffline) {
        toast.info(OFFLINE_REDETECT_MESSAGE);
        return;
      }

      if (isModelLoading || isModelError) return;

      const detectionSettings = getEffectiveDetectionSettings(getDetectionSettings(), isOffline);
      const customMaskTerms = getCustomMaskTerms();

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
          { detectionSettings, customMaskTerms }
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
      getCustomMaskTerms,
      isOffline,
    ]
  );

  return { handleUpload, handleRedetect };
}
