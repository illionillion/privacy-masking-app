import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  FUSELY_PREFS_STORAGE_KEY,
  loadFuselyPrefs,
  normalizeFuselyPrefs,
  saveCustomMaskTerms,
  saveDetectionPrefs,
  saveFuselyPrefs,
} from "./fuselyPrefs";
import { DEFAULT_FUSELY_PREFS } from "./types";

describe("fuselyPrefs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("未保存時はデフォルトを返す", () => {
    expect(loadFuselyPrefs()).toEqual(DEFAULT_FUSELY_PREFS);
  });

  it("部分欠損 JSON をデフォルトで補完する", () => {
    window.localStorage.setItem(
      FUSELY_PREFS_STORAGE_KEY,
      JSON.stringify({ version: 1, detection: { autoDetectFace: false } })
    );

    expect(loadFuselyPrefs()).toEqual({
      version: 2,
      detection: { autoDetectFace: false, autoDetectOcr: true },
      customMaskTerms: [],
    });
  });

  it("保存時に既存の未知キーを維持する", () => {
    window.localStorage.setItem(
      FUSELY_PREFS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        legacyFlag: true,
        detection: { autoDetectFace: true, autoDetectOcr: true },
      })
    );

    saveDetectionPrefs({ autoDetectFace: false, autoDetectOcr: false });

    const parsed = JSON.parse(
      window.localStorage.getItem(FUSELY_PREFS_STORAGE_KEY) ?? "{}"
    ) as Record<string, unknown>;
    expect(parsed.legacyFlag).toBe(true);
    expect(parsed.detection).toEqual({ autoDetectFace: false, autoDetectOcr: false });
  });

  it("壊れた JSON のときはデフォルトにフォールバックする", () => {
    window.localStorage.setItem(FUSELY_PREFS_STORAGE_KEY, "{invalid");
    expect(loadFuselyPrefs()).toEqual(DEFAULT_FUSELY_PREFS);
  });

  it("normalizeFuselyPrefs は v1 保存データの version を v2 以上に引き上げる", () => {
    expect(
      normalizeFuselyPrefs({
        version: 1,
        detection: DEFAULT_FUSELY_PREFS.detection,
      }).version
    ).toBe(2);
  });

  it("normalizeFuselyPrefs は型不一致フィールドを default で補う", () => {
    expect(
      normalizeFuselyPrefs({
        version: "1",
        detection: { autoDetectFace: "yes", autoDetectOcr: false },
      })
    ).toEqual({
      version: 2,
      detection: { autoDetectFace: true, autoDetectOcr: false },
      customMaskTerms: [],
    });
  });

  it("customMaskTerms を読み書きできる", () => {
    const terms = [{ id: "term-1", text: "山田太郎", enabled: true }];

    saveFuselyPrefs({
      version: 2,
      detection: DEFAULT_FUSELY_PREFS.detection,
      customMaskTerms: terms,
    });

    expect(loadFuselyPrefs().customMaskTerms).toEqual(terms);
  });

  it("setItem が例外を投げてもクラッシュしない", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() =>
      saveFuselyPrefs({
        version: 2,
        detection: { autoDetectFace: false, autoDetectOcr: true },
        customMaskTerms: [],
      })
    ).not.toThrow();
  });

  it("saveFuselyPrefs で全体を保存できる", () => {
    saveFuselyPrefs({
      version: 2,
      detection: { autoDetectFace: false, autoDetectOcr: true },
      customMaskTerms: [],
    });
    expect(loadFuselyPrefs().detection).toEqual({
      autoDetectFace: false,
      autoDetectOcr: true,
    });
  });

  it("saveCustomMaskTerms で語句のみ更新できる", () => {
    saveCustomMaskTerms([{ id: "t1", text: "山田太郎", enabled: true }]);
    expect(loadFuselyPrefs().customMaskTerms).toEqual([
      { id: "t1", text: "山田太郎", enabled: true },
    ]);
  });
});
