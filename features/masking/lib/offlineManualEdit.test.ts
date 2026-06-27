import { describe, expect, it } from "vitest";
import {
  getEffectiveDetectionSettings,
  getOfflineAwareDetectionBarState,
  isUploadBlockedByModelState,
  OFFLINE_MANUAL_EDIT_DETECTION_SETTINGS,
} from "./offlineManualEdit";

describe("offlineManualEdit", () => {
  const onlineSettings = { autoDetectFace: true, autoDetectOcr: true };

  it("オンライン時は元の検出設定をそのまま返す", () => {
    expect(getEffectiveDetectionSettings(onlineSettings, false)).toEqual(onlineSettings);
  });

  it("オフライン時は自動検出をすべてオフにする", () => {
    expect(getEffectiveDetectionSettings(onlineSettings, true)).toEqual(
      OFFLINE_MANUAL_EDIT_DETECTION_SETTINGS
    );
  });

  it("オフライン時はモデル状態でアップロードをブロックしない", () => {
    expect(isUploadBlockedByModelState(true, true, true)).toBe(false);
  });

  it("オンライン時はモデルロード中・エラーでアップロードをブロックする", () => {
    expect(isUploadBlockedByModelState(false, true, false)).toBe(true);
    expect(isUploadBlockedByModelState(false, false, true)).toBe(true);
    expect(isUploadBlockedByModelState(false, false, false)).toBe(false);
  });

  it("オフライン時は検出設定バー向けの表示 state を組み立てる", () => {
    const state = getOfflineAwareDetectionBarState(
      { autoDetectFace: true, autoDetectOcr: true },
      [{ id: "1", text: "伏せ太郎", enabled: true }],
      true
    );

    expect(state.detectionSettingsSummary).toBe("オフライン（手動のみ）");
    expect(state.customMaskTermsSummary).toBe("利用不可（OCR オフ）");
    expect(state.isCustomMaskTermsEditable).toBe(false);
  });
});
