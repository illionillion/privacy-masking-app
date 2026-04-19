import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useEditor } from "./useEditor";

describe("useEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "test-uuid"),
    });
  });

  it("初期状態では領域が空", () => {
    const { result } = renderHook(() => useEditor());
    expect(result.current.regions).toHaveLength(0);
  });

  it("addRegion で領域を追加できる", () => {
    const { result } = renderHook(() => useEditor());
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
    const { result } = renderHook(() => useEditor());
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
    const { result } = renderHook(() => useEditor());
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
    const { result } = renderHook(() => useEditor());
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
    const { result } = renderHook(() => useEditor());
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
});
