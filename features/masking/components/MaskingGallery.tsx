"use client";

import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import { Settings, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { useFaceDetection } from "@/features/face-detection";
import { useOcr } from "@/features/ocr";
import type { DetectionPrefs } from "@/lib/preferences";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import { useClipboardImagePaste } from "../hooks/useClipboardImagePaste";
import { DETECTION_SETTINGS_BAR_REVEAL_MS, useDelayedReveal } from "../hooks/useDelayedReveal";
import { useCustomMaskTerms } from "../hooks/useCustomMaskTerms";
import { useDetectionSettings } from "../hooks/useDetectionSettings";
import { useGalleryDetection } from "../hooks/useGalleryDetection";
import { useGalleryImages } from "../hooks/useGalleryImages";
import { useStampImages } from "../hooks/useStampImages";
import { downloadMaskedImagesAsZip } from "../lib/downloadMaskedImagesAsZip";
import {
  formatCustomMaskTermsSummary,
  formatDetectionSettingsSummary,
} from "../lib/detectionMessages";
import {
  getEffectiveDetectionSettings,
  isUploadBlockedByModelState,
} from "../lib/offlineManualEdit";
import { CustomMaskTermsModal } from "./CustomMaskTermsModal";
import { DetectionSettingsBarSkeleton } from "./DetectionSettingsBarSkeleton";
import { DetectionSettingsModal } from "./DetectionSettingsModal";
import { EditorModal } from "./EditorModal";
import { GalleryItem } from "./GalleryItem";
import { OfflineManualEditBanner } from "./OfflineManualEditBanner";

/**
 * メインマスキングギャラリーコンポーネント
 *
 * 画像アップロード、顔検出、Canvas表示を統合する。
 */
export function MaskingGallery() {
  const { isOffline } = useNetworkStatus();
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
  const {
    settings: detectionSettings,
    isReady: isDetectionSettingsReady,
    updateSettings: updateDetectionSettings,
  } = useDetectionSettings();
  const {
    terms: customMaskTerms,
    isReady: isCustomMaskTermsReady,
    enabledTexts: enabledCustomMaskTexts,
    updateTerms: updateCustomMaskTerms,
  } = useCustomMaskTerms();
  const isSettingsBarReady = isDetectionSettingsReady && isCustomMaskTermsReady;
  const showDetectionSettingsBar = useDelayedReveal(
    isSettingsBarReady,
    DETECTION_SETTINGS_BAR_REVEAL_MS
  );
  const [isDetectionSettingsOpen, setIsDetectionSettingsOpen] = useState(false);
  const [detectionSettingsModalKey, setDetectionSettingsModalKey] = useState(0);
  const [isCustomMaskTermsOpen, setIsCustomMaskTermsOpen] = useState(false);
  const [customMaskTermsModalKey, setCustomMaskTermsModalKey] = useState(0);

  const getDetectionSettings = useCallback(() => detectionSettings, [detectionSettings]);
  const getCustomMaskTerms = useCallback(() => enabledCustomMaskTexts, [enabledCustomMaskTexts]);

  const effectiveDetectionSettings = useMemo(
    () => getEffectiveDetectionSettings(detectionSettings, isOffline),
    [detectionSettings, isOffline]
  );

  const detectionSettingsSummary = useMemo(
    () =>
      isOffline ? "オフライン（手動のみ）" : formatDetectionSettingsSummary(detectionSettings),
    [detectionSettings, isOffline]
  );
  const customMaskTermsSummary = useMemo(
    () =>
      formatCustomMaskTermsSummary(customMaskTerms, {
        ocrEnabled: effectiveDetectionSettings.autoDetectOcr,
      }),
    [customMaskTerms, effectiveDetectionSettings.autoDetectOcr]
  );
  const isCustomMaskTermsEditable = effectiveDetectionSettings.autoDetectOcr;
  const isUploadBlockedByModel = isUploadBlockedByModelState(
    isOffline,
    isModelLoading,
    isModelError
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
    getCustomMaskTerms,
    isOffline,
  });

  useClipboardImagePaste({
    onUpload: handleUpload,
    isModelLoading,
    isModelError,
    isOffline,
  });

  const handleSaveDetectionSettings = useCallback(
    (settings: DetectionPrefs) => {
      updateDetectionSettings(settings);
      if (!settings.autoDetectOcr) {
        setIsCustomMaskTermsOpen(false);
      }
    },
    [updateDetectionSettings]
  );

  const handleDownloadAll = useCallback(() => {
    downloadMaskedImagesAsZip(images, () => {
      if (isMountedRef.current) {
        toast.error("ZIPの生成に失敗しました");
      }
    });
  }, [images, isMountedRef]);

  const hasProcessingImage = images.some((image) => image.isProcessing);
  const isProcessing = isDetecting || isRecognizing || hasProcessingImage;
  const loadingMessage = !isOffline && isModelLoading ? "顔検出モデルをロード中…" : null;
  const downloadableImagesCount = images.filter(
    (image) => image.maskedBlobUrl && !image.isProcessing
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <OfflineManualEditBanner visible={isOffline} />
      {!showDetectionSettingsBar ? (
        <DetectionSettingsBarSkeleton />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 text-sm text-zinc-600">
            <p>
              自動検出:{" "}
              <span className="font-medium text-zinc-800">{detectionSettingsSummary}</span>
            </p>
            <p>
              マスク語句:{" "}
              <span
                className={clsx([
                  "font-medium",
                  isCustomMaskTermsEditable ? "text-zinc-800" : "text-zinc-500",
                ])}
              >
                {customMaskTermsSummary}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button"
              aria-label="検出設定"
              onClick={() => {
                setDetectionSettingsModalKey((key) => key + 1);
                setIsDetectionSettingsOpen(true);
              }}
              className={clsx([
                "flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2",
                "text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50",
              ])}
            >
              <Settings className="size-4 shrink-0" aria-hidden="true" />
              検出設定
            </button>
            <button
              type="button"
              aria-label="マスク語句"
              title={
                isCustomMaskTermsEditable
                  ? undefined
                  : "テキスト自動検出（OCR）をオンにすると編集できます"
              }
              disabled={!isCustomMaskTermsEditable}
              onClick={() => {
                setCustomMaskTermsModalKey((key) => key + 1);
                setIsCustomMaskTermsOpen(true);
              }}
              className={clsx([
                "flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2",
                "text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50",
                !isCustomMaskTermsEditable && "cursor-not-allowed opacity-50 hover:bg-transparent",
              ])}
            >
              <ListChecks className="size-4 shrink-0" aria-hidden="true" />
              マスク語句
            </button>
          </div>
        </div>
      )}

      {showDetectionSettingsBar && (
        <>
          <DetectionSettingsModal
            key={`detection-settings-${detectionSettingsModalKey}`}
            isOpen={isDetectionSettingsOpen}
            settings={detectionSettings}
            onClose={() => setIsDetectionSettingsOpen(false)}
            onSave={handleSaveDetectionSettings}
          />
          <CustomMaskTermsModal
            key={`custom-mask-terms-${customMaskTermsModalKey}`}
            isOpen={isCustomMaskTermsOpen}
            terms={customMaskTerms}
            onClose={() => setIsCustomMaskTermsOpen(false)}
            onSave={updateCustomMaskTerms}
          />
        </>
      )}

      <ImageUpload
        onUpload={handleUpload}
        disabled={isProcessing || isUploadBlockedByModel}
        multiple
        loadingMessage={loadingMessage}
      />
      {isModelError && !isOffline && (
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
                isOffline={isOffline}
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
