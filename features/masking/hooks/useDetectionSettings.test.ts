import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DEFAULT_FUSELY_PREFS } from "@/lib/preferences";
import { useDetectionSettings } from "./useDetectionSettings";

describe("useDetectionSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("localStorage 未保存時はデフォルト設定を返す", () => {
    const { result } = renderHook(() => useDetectionSettings());

    expect(result.current.settings).toEqual(DEFAULT_FUSELY_PREFS.detection);
    expect(result.current.isLoaded).toBe(true);
  });

  it("updateSettings で設定を保存・反映する", () => {
    const { result } = renderHook(() => useDetectionSettings());

    act(() => {
      result.current.updateSettings({ autoDetectFace: false, autoDetectOcr: true });
    });

    expect(result.current.settings).toEqual({
      autoDetectFace: false,
      autoDetectOcr: true,
    });
  });
});
