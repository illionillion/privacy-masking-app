import { describe, it, expect } from "vitest";
import {
  createTermId,
  getEnabledCustomMaskTexts,
  MAX_CUSTOM_MASK_TERMS,
  normalizeCustomMaskTerms,
  sanitizeCustomMaskTermsForSave,
} from "./customMaskTerms";
import type { CustomMaskTerm } from "./types";

describe("customMaskTerms", () => {
  it("normalizeCustomMaskTerms は不正エントリを除外する", () => {
    expect(
      normalizeCustomMaskTerms([
        { id: "a", text: " 山田太郎 ", enabled: true },
        { id: "b", text: "", enabled: true },
        "invalid",
        { id: "c", text: "未来創造", enabled: false },
      ])
    ).toEqual([
      { id: "a", text: "山田太郎", enabled: true },
      { id: "c", text: "未来創造", enabled: false },
    ]);
  });

  it("sanitizeCustomMaskTermsForSave は重複と空文字を除去する", () => {
    const terms: CustomMaskTerm[] = [
      { id: "1", text: " 山田太郎 ", enabled: true },
      { id: "2", text: "山田太郎", enabled: false },
      { id: "3", text: "", enabled: true },
    ];

    expect(sanitizeCustomMaskTermsForSave(terms)).toEqual([
      { id: "1", text: "山田太郎", enabled: true },
    ]);
  });

  it("sanitizeCustomMaskTermsForSave は件数上限を適用する", () => {
    const terms = Array.from({ length: MAX_CUSTOM_MASK_TERMS + 5 }, (_, index) => ({
      id: `id-${index}`,
      text: `語句${index}`,
      enabled: true,
    }));

    expect(sanitizeCustomMaskTermsForSave(terms)).toHaveLength(MAX_CUSTOM_MASK_TERMS);
  });

  it("getEnabledCustomMaskTexts は有効な語句のみ返す", () => {
    const terms: CustomMaskTerm[] = [
      { id: "1", text: "山田太郎", enabled: true },
      { id: "2", text: "伏せ太郎", enabled: false },
    ];

    expect(getEnabledCustomMaskTexts(terms)).toEqual(["山田太郎"]);
  });

  it("createTermId は非空文字列を返す", () => {
    expect(createTermId().length).toBeGreaterThan(0);
  });
});
