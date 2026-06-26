import { describe, expect, it } from "vitest";
import {
  getEffectiveDetectionSettings,
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
});
