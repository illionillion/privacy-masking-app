import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useMaskingRegions } from "./useMaskingRegions";

describe("useMaskingRegions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "test-uuid"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("初期状態では領域が空", () => {
    const { result } = renderHook(() => useMaskingRegions());
    expect(result.current.regions).toHaveLength(0);
  });

  it("addRegion で領域を追加できる", () => {
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.addRegion({ x: 10, y: 20, width: 100, height: 80, type: "face" });
    });
    expect(result.current.regions).toHaveLength(1);
    expect(result.current.regions[0]).toMatchObject({
      x: 10,
      y: 20,
      width: 100,
      height: 80,
      type: "face",
      isEnabled: true,
    });
  });

  it("toggleRegion で isEnabled を切り替えられる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("id-1") });
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.addRegion({ x: 0, y: 0, width: 50, height: 50, type: "face" });
    });
    expect(result.current.regions[0].isEnabled).toBe(true);
    act(() => {
      result.current.toggleRegion("id-1");
    });
    expect(result.current.regions[0].isEnabled).toBe(false);
  });

  it("removeRegion で領域を削除できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("id-del") });
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.addRegion({ x: 0, y: 0, width: 50, height: 50, type: "face" });
    });
    expect(result.current.regions).toHaveLength(1);
    act(() => {
      result.current.removeRegion("id-del");
    });
    expect(result.current.regions).toHaveLength(0);
  });

  it("setRegions で複数領域を一括セットできる", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("bulk-1").mockReturnValueOnce("bulk-2"),
    });
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.setRegions([
        { x: 0, y: 0, width: 50, height: 50, type: "face" },
        { x: 10, y: 10, width: 30, height: 30, type: "manual" },
      ]);
    });
    expect(result.current.regions).toHaveLength(2);
    expect(result.current.regions[0].id).toBe("bulk-1");
    expect(result.current.regions[1].id).toBe("bulk-2");
    expect(result.current.regions[0].isEnabled).toBe(true);
  });

  it("resetRegions ですべての領域をリセットできる", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("id-1").mockReturnValueOnce("id-2"),
    });
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.addRegion({ x: 0, y: 0, width: 50, height: 50, type: "face" });
      result.current.addRegion({ x: 10, y: 10, width: 30, height: 30, type: "manual" });
    });
    expect(result.current.regions).toHaveLength(2);
    act(() => {
      result.current.resetRegions();
    });
    expect(result.current.regions).toHaveLength(0);
  });

  it("crypto.randomUUID が未定義でも getRandomValues フォールバックで UUID を生成できる", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        arr.fill(0xab);
        return arr;
      }),
    });
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.addRegion({ x: 0, y: 0, width: 50, height: 50, type: "face" });
    });
    expect(result.current.regions).toHaveLength(1);
    /** UUID v4 形式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx */
    expect(result.current.regions[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("crypto が完全に未定義でも Math.random フォールバックで UUID を生成できる", () => {
    vi.stubGlobal("crypto", undefined);
    const { result } = renderHook(() => useMaskingRegions());
    act(() => {
      result.current.addRegion({ x: 0, y: 0, width: 50, height: 50, type: "face" });
    });
    expect(result.current.regions).toHaveLength(1);
    expect(result.current.regions[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
