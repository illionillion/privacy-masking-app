import { describe, it, expect } from "vitest";
import { hasCustomMaskTermsChanges, hasDetectionSettingsChanges } from "./unsavedModalClose";

describe("unsavedModalClose", () => {
  it("検出設定の差分を検出する", () => {
    const saved = { autoDetectFace: true, autoDetectOcr: true };
    expect(hasDetectionSettingsChanges(saved, saved)).toBe(false);
    expect(hasDetectionSettingsChanges({ autoDetectFace: false, autoDetectOcr: true }, saved)).toBe(
      true
    );
  });

  it("マスク語句の差分を検出する", () => {
    const saved = [{ id: "1", text: "山田太郎", enabled: true }];
    expect(hasCustomMaskTermsChanges(saved, saved)).toBe(false);
    expect(hasCustomMaskTermsChanges([{ id: "1", text: "田中", enabled: true }], saved)).toBe(true);
    expect(hasCustomMaskTermsChanges([], saved)).toBe(true);
    expect(hasCustomMaskTermsChanges(saved, saved, "入力中")).toBe(true);
  });
});
