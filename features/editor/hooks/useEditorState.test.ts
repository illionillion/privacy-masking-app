import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useEditorState } from "./useEditorState";

describe("useEditorState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "test-uuid"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("初期状態が正しい", () => {
    const { result } = renderHook(() => useEditorState());
    expect(result.current.mode).toBe("select");
    expect(result.current.stampRegions).toHaveLength(0);
    expect(result.current.fillRegions).toHaveLength(0);
    expect(result.current.paintStrokes).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedStampType).toBe("stamp-face");
    expect(result.current.brushSize).toBe(20);
  });

  it("initFromDetections で StampRegion と FillRegion を初期化できる", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("s-1").mockReturnValueOnce("f-1"),
    });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.initFromDetections(
        [{ x: 10, y: 20, width: 50, height: 60 }],
        [{ x: 100, y: 200, width: 80, height: 30, text: "test@example.com" }]
      );
    });
    expect(result.current.stampRegions).toHaveLength(1);
    expect(result.current.stampRegions[0]).toMatchObject({
      id: "s-1",
      x: 10,
      y: 20,
      width: 50,
      height: 60,
      stampType: "stamp-face",
      isEnabled: true,
      source: "face-detection",
    });
    expect(result.current.fillRegions).toHaveLength(1);
    expect(result.current.fillRegions[0]).toMatchObject({
      id: "f-1",
      x: 100,
      y: 200,
      width: 80,
      height: 30,
      isEnabled: true,
      source: "ocr",
      text: "test@example.com",
    });
  });

  it("addStampRegion でスタンプ領域を追加できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("stamp-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "mosaic",
        isEnabled: true,
        source: "manual",
      });
    });
    expect(result.current.stampRegions).toHaveLength(1);
    expect(result.current.stampRegions[0].stampType).toBe("mosaic");
    expect(result.current.stampRegions[0].source).toBe("manual");
  });

  it("addFillRegion で塗りつぶし領域を追加できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("fill-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addFillRegion({
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        isEnabled: true,
        source: "manual",
      });
    });
    expect(result.current.fillRegions).toHaveLength(1);
    expect(result.current.fillRegions[0].source).toBe("manual");
  });

  it("addPaintStroke でペイントストロークを追加できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("stroke-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addPaintStroke({
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        brushSize: 20,
        isEnabled: true,
      });
    });
    expect(result.current.paintStrokes).toHaveLength(1);
    expect(result.current.paintStrokes[0].id).toBe("stroke-uuid");
  });

  it("updateStampRegion でスタンプ領域を更新できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("upd-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "stamp-face",
        isEnabled: true,
        source: "manual",
      });
    });
    act(() => {
      result.current.updateStampRegion("upd-uuid", { stampType: "blur", x: 100 });
    });
    expect(result.current.stampRegions[0].stampType).toBe("blur");
    expect(result.current.stampRegions[0].x).toBe(100);
  });

  it("選択中領域を stamp-face に変更すると選択中ファイル名を引き継ぐ", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("stamp-switch-uuid") });
    const { result } = renderHook(() => useEditorState("selected-face.png"));
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "mosaic",
        isEnabled: true,
        source: "manual",
      });
    });
    act(() => {
      result.current.selectItem("stamp-switch-uuid");
    });
    act(() => {
      result.current.setSelectedStampType("stamp-face");
    });
    expect(result.current.stampRegions[0]).toMatchObject({
      stampType: "stamp-face",
      stampFileName: "selected-face.png",
    });
  });

  it("updatePaintStroke でペイントストロークの points と brushSize を更新できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("stroke-update-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addPaintStroke({
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        brushSize: 20,
        isEnabled: true,
      });
    });
    act(() => {
      result.current.updatePaintStroke("stroke-update-uuid", {
        points: [
          { x: 100, y: 100 },
          { x: 110, y: 110 },
        ],
        brushSize: 40,
      });
    });
    expect(result.current.paintStrokes[0]).toMatchObject({
      id: "stroke-update-uuid",
      points: [
        { x: 100, y: 100 },
        { x: 110, y: 110 },
      ],
      brushSize: 40,
      isEnabled: true,
    });
  });

  it("updatePaintStroke は存在しないIDでは何も変更しない", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("noop-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addPaintStroke({
        points: [{ x: 0, y: 0 }],
        brushSize: 10,
        isEnabled: true,
      });
    });
    act(() => {
      result.current.updatePaintStroke("not-exist", { brushSize: 99 });
    });
    expect(result.current.paintStrokes).toHaveLength(1);
    expect(result.current.paintStrokes[0].brushSize).toBe(10);
  });

  it("toggleFillRegion で isEnabled を切り替えられる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("tog-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addFillRegion({
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        isEnabled: true,
        source: "manual",
      });
    });
    expect(result.current.fillRegions[0].isEnabled).toBe(true);
    act(() => {
      result.current.toggleFillRegion("tog-uuid");
    });
    expect(result.current.fillRegions[0].isEnabled).toBe(false);
  });

  it("removeItem で指定IDのアイテムを削除できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("del-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "mosaic",
        isEnabled: true,
        source: "manual",
      });
    });
    expect(result.current.stampRegions).toHaveLength(1);
    act(() => {
      result.current.removeItem("del-uuid");
    });
    expect(result.current.stampRegions).toHaveLength(0);
  });

  it("removeSelectedItem で選択中のアイテムを削除できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("sel-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "fill-black",
        isEnabled: true,
        source: "manual",
      });
    });
    act(() => {
      result.current.selectItem("sel-uuid");
    });
    expect(result.current.selectedId).toBe("sel-uuid");
    act(() => {
      result.current.removeSelectedItem();
    });
    expect(result.current.stampRegions).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
  });

  it("initFromDetections は選択状態をリセットする", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("reset-uuid"),
    });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.selectItem("some-id");
    });
    expect(result.current.selectedId).toBe("some-id");
    act(() => {
      result.current.initFromDetections([], []);
    });
    expect(result.current.selectedId).toBeNull();
  });

  it("crypto.randomUUID が未定義でも getRandomValues フォールバックで UUID を生成できる", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: vi.fn((arr: Uint8Array) => {
        arr.fill(0xab);
        return arr;
      }),
    });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "mosaic",
        isEnabled: true,
        source: "manual",
      });
    });
    expect(result.current.stampRegions).toHaveLength(1);
    expect(result.current.stampRegions[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("crypto が完全に未定義でも Math.random フォールバックで UUID を生成できる", () => {
    vi.stubGlobal("crypto", undefined);
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addPaintStroke({
        points: [{ x: 0, y: 0 }],
        brushSize: 10,
        isEnabled: true,
      });
    });
    expect(result.current.paintStrokes).toHaveLength(1);
    expect(result.current.paintStrokes[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
