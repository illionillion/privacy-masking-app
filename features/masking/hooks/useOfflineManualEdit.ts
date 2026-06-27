"use client";

import { useMemo } from "react";
import type { CustomMaskTerm, DetectionPrefs } from "@/lib/preferences";
import { useNetworkStatus } from "@/lib/useNetworkStatus";
import {
  getOfflineAwareDetectionBarState,
  isUploadBlockedByModelState,
} from "../lib/offlineManualEdit";

/** useOfflineManualEdit のオプション */
export type UseOfflineManualEditOptions = {
  detectionSettings: DetectionPrefs;
  customMaskTerms: readonly CustomMaskTerm[];
  isModelLoading: boolean;
  isModelError: boolean;
};

/**
 * オフライン手動編集モードに関する UI 状態をまとめて提供する。
 */
export function useOfflineManualEdit(options: UseOfflineManualEditOptions) {
  const { detectionSettings, customMaskTerms, isModelLoading, isModelError } = options;
  const { isOffline } = useNetworkStatus();

  const detectionBar = useMemo(
    () => getOfflineAwareDetectionBarState(detectionSettings, customMaskTerms, isOffline),
    [customMaskTerms, detectionSettings, isOffline]
  );

  const isUploadBlockedByModel = isUploadBlockedByModelState(
    isOffline,
    isModelLoading,
    isModelError
  );
  const modelLoadingMessage = !isOffline && isModelLoading ? "顔検出モデルをロード中…" : null;
  const showModelErrorAlert = isModelError && !isOffline;

  return {
    isOffline,
    ...detectionBar,
    isUploadBlockedByModel,
    modelLoadingMessage,
    showModelErrorAlert,
  };
}
