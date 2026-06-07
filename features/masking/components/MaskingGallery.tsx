"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { useFaceDetection } from "@/features/face-detection";
import { useOcr } from "@/features/ocr";
import { useClipboardImagePaste } from "../hooks/useClipboardImagePaste";
import { useDetectionSettings } from "../hooks/useDetectionSettings";
import { useGalleryDetection } from "../hooks/useGalleryDetection";
import { useGalleryImages } from "../hooks/useGalleryImages";
import { useStampImages } from "../hooks/useStampImages";
import { downloadMaskedImagesAsZip } from "../lib/downloadMaskedImagesAsZip";
import { formatDetectionSettingsSummary } from "../lib/detectionMessages";
import { DetectionSettingsModal } from "./DetectionSettingsModal";
import { EditorModal } from "./EditorModal";
import { GalleryItem } from "./GalleryItem";

/**
 * メインマスキングギャラリーコンポーネント
 *
 * 画像アップロード、顔検出、Canvas表示を統合する。
 */
export function MaskingGallery() {
  const stampImages = useStampImages();
  const {
    images,
    setImages,
    isMountedRef,
    activeImageId,
    setActiveImageId,
    setEditingImageId,
    editingImage,
    handleOpenEdit,
    handleRendered,
    handleClearAll,
  } = useGalleryImages();

  const { isModelLoading, isModelError, isDetecting, detectFaces } = useFaceDetection();
  const { isRecognizing, recognizeText } = useOcr();
  const { settings: detectionSettings, updateSettings: updateDetectionSettings } =
    useDetectionSettings();
  const [isDetectionSettingsOpen, setIsDetectionSettingsOpen] = useState(false);
  const [detectionSettingsModalKey, setDetectionSettingsModalKey] = useState(0);

  const detectionSettingsRef = useRef(detectionSettings);
  useEffect(() => {
    detectionSettingsRef.current = detectionSettings;
  }, [detectionSettings]);

  const getDetectionSettings = useCallback(() => detectionSettingsRef.current, []);

  const detectionSettingsSummary = useMemo(
    () => formatDetectionSettingsSummary(detectionSettings),
    [detectionSettings]
  );

  const { handleUpload, handleRedetect } = useGalleryDetection({
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
  });

  useClipboardImagePaste({ onUpload: handleUpload, isModelLoading, isModelError });

  const handleDownloadAll = useCallback(() => {
    downloadMaskedImagesAsZip(images, () => {
      if (isMountedRef.current) {
        toast.error("ZIPの生成に失敗しました");
      }
    });
  }, [images, isMountedRef]);

  const hasProcessingImage = images.some((image) => image.isProcessing);
  const isProcessing = isDetecting || isRecognizing || hasProcessingImage;
  const loadingMessage = isModelLoading ? "顔検出モデルをロード中…" : null;
  const downloadableImagesCount = images.filter(
    (image) => image.maskedBlobUrl && !image.isProcessing
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          自動検出: <span className="font-medium text-zinc-800">{detectionSettingsSummary}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setDetectionSettingsModalKey((key) => key + 1);
            setIsDetectionSettingsOpen(true);
          }}
          className="self-start rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:self-auto"
        >
          検出設定
        </button>
      </div>

      <DetectionSettingsModal
        key={detectionSettingsModalKey}
        isOpen={isDetectionSettingsOpen}
        settings={detectionSettings}
        onClose={() => setIsDetectionSettingsOpen(false)}
        onSave={updateDetectionSettings}
      />

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
          key={editingImage.id}
          image={editingImage}
          stampImages={stampImages}
          onClose={() => setEditingImageId(null)}
          onRendered={handleRendered}
        />
      )}
    </div>
  );
}
