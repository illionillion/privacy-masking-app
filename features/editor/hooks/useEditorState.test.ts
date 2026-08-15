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
    expect(result.current.paintStrokes).toHaveLength(0);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedStampType).toBe("stamp-face");
    expect(result.current.brushSize).toBe(20);
  });

  it("initFromDetections で顔検出と OCR を StampRegion として初期化できる", () => {
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
    expect(result.current.stampRegions).toHaveLength(2);
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
    expect(result.current.stampRegions[0]?.stampFileName).toBeTruthy();
    expect(result.current.stampRegions[1]).toMatchObject({
      id: "f-1",
      x: 100,
      y: 200,
      width: 80,
      height: 30,
      stampType: "fill-black",
      isEnabled: true,
      source: "ocr",
      text: "test@example.com",
    });
  });

  it("顔スタンプ領域を選択するとプルダウン用ファイル名が同期する", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("face-sync-1").mockReturnValueOnce("ocr-sync-1"),
    });
    const { result } = renderHook(() => useEditorState("beaming_face_with_smiling_eyes-64.png"));
    act(() => {
      result.current.initFromDetections(
        [{ x: 10, y: 20, width: 50, height: 60 }],
        [{ x: 0, y: 0, width: 10, height: 10, text: "x" }]
      );
    });
    const faceRegion = result.current.stampRegions[0];
    expect(faceRegion?.stampType).toBe("stamp-face");
    expect(faceRegion?.stampFileName).toBeTruthy();

    act(() => {
      result.current.selectItem(faceRegion!.id);
    });
    expect(result.current.selectedStampFileName).toBe(faceRegion!.stampFileName);
  });

  it("stampFileName 未設定の stamp-face を選択すると解決してバックフィルする", () => {
    const { result } = renderHook(() => useEditorState("beaming_face_with_smiling_eyes-64.png"));
    act(() => {
      result.current.restoreSnapshot({
        mode: "select",
        stampRegions: [
          {
            id: "legacy-face",
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            stampType: "stamp-face",
            isEnabled: true,
            source: "face-detection",
          },
        ],
        paintStrokes: [],
        selectedId: null,
        selectedStampType: "stamp-face",
        selectedStampFileName: "beaming_face_with_smiling_eyes-64.png",
        brushSize: 20,
        cropRect: null,
      });
    });
    act(() => {
      result.current.selectItem("legacy-face");
    });
    expect(result.current.selectedStampFileName).toBeTruthy();
    expect(result.current.selectedStampFileName).not.toBe("");
    expect(result.current.stampRegions[0]?.stampFileName).toBe(
      result.current.selectedStampFileName
    );
  });

  it("addStampRegion でマスキング領域を追加できる", () => {
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
    expect(result.current.selectedId).toBe("stamp-uuid");
  });

  it("addStampRegion は追加した領域を選択するがモードは変更しない", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("auto-select-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.onChangeMode("rect");
    });
    expect(result.current.mode).toBe("rect");
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
    expect(result.current.mode).toBe("rect");
    expect(result.current.selectedId).toBe("auto-select-uuid");
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

  it("updateStampRegion でマスキング領域を更新できる", () => {
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

  it("選択中の OCR 領域の種別を変更できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("ocr-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.initFromDetections(
        [],
        [{ x: 0, y: 0, width: 30, height: 30, text: "secret@example.com" }]
      );
    });
    act(() => {
      result.current.selectItem("ocr-uuid");
    });
    act(() => {
      result.current.setSelectedStampType("blur");
    });
    expect(result.current.stampRegions[0]).toMatchObject({
      id: "ocr-uuid",
      stampType: "blur",
      source: "ocr",
      text: "secret@example.com",
    });
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

  it("選択中領域を fill-text に変更するとデフォルト文言・色を付与する", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("text-switch-uuid") });
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
      result.current.selectItem("text-switch-uuid");
    });
    act(() => {
      result.current.setSelectedStampType("fill-text");
    });
    expect(result.current.stampRegions[0]).toMatchObject({
      stampType: "fill-text",
      overlayText: "個人情報",
      textColor: "#ffffff",
      backgroundColor: "#000000",
    });
  });

  it("fill-text 領域の overlayText・色を updateStampRegion で更新できる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("text-update-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        stampType: "fill-text",
        overlayText: "個人情報",
        textColor: "#ffffff",
        backgroundColor: "#000000",
        isEnabled: true,
        source: "manual",
      });
    });
    act(() => {
      result.current.updateStampRegion("text-update-uuid", {
        overlayText: "非公開",
        textColor: "#ff0000",
        backgroundColor: "#0000ff",
      });
    });
    expect(result.current.stampRegions[0]).toMatchObject({
      overlayText: "非公開",
      textColor: "#ff0000",
      backgroundColor: "#0000ff",
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

  it("toggleStampRegion で isEnabled を切り替えられる", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn().mockReturnValue("tog-uuid") });
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.addStampRegion({
        x: 0,
        y: 0,
        width: 30,
        height: 30,
        stampType: "fill-black",
        isEnabled: true,
        source: "manual",
      });
    });
    expect(result.current.stampRegions[0].isEnabled).toBe(true);
    act(() => {
      result.current.toggleStampRegion("tog-uuid");
    });
    expect(result.current.stampRegions[0].isEnabled).toBe(false);
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

  it("updateCropRect はその場で cropRect に反映し、モードを抜けても残る", () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.onChangeMode("crop");
    });
    expect(result.current.mode).toBe("crop");
    expect(result.current.cropRect).toBeNull();

    act(() => {
      result.current.updateCropRect(
        { x: 10, y: 20, width: 80, height: 50 },
        { width: 200, height: 100 }
      );
    });
    expect(result.current.cropRect).toEqual({ x: 10, y: 20, width: 80, height: 50 });

    act(() => {
      result.current.onChangeMode("select");
    });
    expect(result.current.mode).toBe("select");
    expect(result.current.cropRect).toEqual({ x: 10, y: 20, width: 80, height: 50 });
  });

  it("フル画像へ戻すと cropRect は null になる", () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.updateCropRect(
        { x: 10, y: 20, width: 80, height: 50 },
        { width: 200, height: 100 }
      );
    });
    act(() => {
      result.current.updateCropRect(
        { x: 0, y: 0, width: 200, height: 100 },
        { width: 200, height: 100 }
      );
    });
    expect(result.current.cropRect).toBeNull();
  });

  it("restoreCrop は crop を解除する", () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.updateCropRect(
        { x: 10, y: 20, width: 80, height: 50 },
        { width: 200, height: 100 }
      );
    });
    act(() => {
      result.current.restoreCrop();
    });
    expect(result.current.cropRect).toBeNull();
  });

  it("getSnapshot に cropRect が含まれる", () => {
    const { result } = renderHook(() => useEditorState());
    act(() => {
      result.current.updateCropRect(
        { x: 5, y: 6, width: 40, height: 30 },
        { width: 100, height: 80 }
      );
    });
    expect(result.current.getSnapshot().cropRect).toEqual({ x: 5, y: 6, width: 40, height: 30 });
  });
});
