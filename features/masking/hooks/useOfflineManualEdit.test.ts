import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOfflineManualEdit } from "./useOfflineManualEdit";

vi.mock("@/lib/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(() => ({ isOnline: false, isOffline: true })),
}));

describe("useOfflineManualEdit", () => {
  const detectionSettings = { autoDetectFace: true, autoDetectOcr: true };

  it("オフライン時は手動編集向けの表示 state を返す", () => {
    const { result } = renderHook(() =>
      useOfflineManualEdit({
        detectionSettings,
        customMaskTerms: [],
        isModelLoading: true,
        isModelError: true,
      })
    );

    expect(result.current.isOffline).toBe(true);
    expect(result.current.detectionSettingsSummary).toBe("オフライン（手動のみ）");
    expect(result.current.isCustomMaskTermsEditable).toBe(false);
    expect(result.current.isUploadBlockedByModel).toBe(false);
    expect(result.current.modelLoadingMessage).toBeNull();
    expect(result.current.showModelErrorAlert).toBe(false);
  });
});
