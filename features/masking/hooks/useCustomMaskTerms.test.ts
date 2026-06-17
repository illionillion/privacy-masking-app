import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { FUSELY_PREFS_STORAGE_KEY } from "@/lib/preferences";
import { useCustomMaskTerms } from "./useCustomMaskTerms";

describe("useCustomMaskTerms", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("初期状態では語句が空", () => {
    const { result } = renderHook(() => useCustomMaskTerms());
    expect(result.current.terms).toEqual([]);
    expect(result.current.enabledTexts).toEqual([]);
    expect(result.current.isReady).toBe(true);
  });

  it("updateTerms で保存・復元できる", () => {
    const { result } = renderHook(() => useCustomMaskTerms());

    act(() => {
      result.current.updateTerms([{ id: "t1", text: "山田太郎", enabled: true }]);
    });

    expect(result.current.terms).toEqual([{ id: "t1", text: "山田太郎", enabled: true }]);
    expect(result.current.enabledTexts).toEqual(["山田太郎"]);

    const stored = JSON.parse(window.localStorage.getItem(FUSELY_PREFS_STORAGE_KEY) ?? "{}") as {
      customMaskTerms: unknown;
    };
    expect(stored.customMaskTerms).toEqual([{ id: "t1", text: "山田太郎", enabled: true }]);
  });
});
