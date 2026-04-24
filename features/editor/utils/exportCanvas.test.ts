import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exportEditorCanvas } from "./exportCanvas";
import type { FillRegion, PaintStroke, StampRegion } from "../types";

/** テスト用の最小 HTMLImageElement モック */
function makeImageElement(width = 100, height = 100): HTMLImageElement {
  return { width, height } as HTMLImageElement;
}

/** テスト用の fillRect 呼び出しを記録するキャプチャ */
type FillRectCall = [number, number, number, number];

function makeCtxMock() {
  const fillRectCalls: FillRectCall[] = [];
  const beginPathCalls: number[] = [];
  const moveToCalls: [number, number][] = [];
  const lineToCalls: [number, number][] = [];
  const strokeCalls: number[] = [];
  const getImageDataCalls: FillRectCall[] = [];
  const saveRestoreCalls: string[] = [];

  const ctx = {
    drawImage: vi.fn(),
    fillRect: vi.fn((...args: number[]) =>
      fillRectCalls.push(args as FillRectCall)
    ),
    beginPath: vi.fn(() => beginPathCalls.push(1)),
    moveTo: vi.fn((...args: number[]) => moveToCalls.push(args as [number, number])),
    lineTo: vi.fn((...args: number[]) => lineToCalls.push(args as [number, number])),
    stroke: vi.fn(() => strokeCalls.push(1)),
    rect: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(() => saveRestoreCalls.push("save")),
    restore: vi.fn(() => saveRestoreCalls.push("restore")),
    getImageData: vi.fn((x: number, y: number, w: number, h: number) => {
      getImageDataCalls.push([x, y, w, h]);
      return { data: new Uint8ClampedArray(w * h * 4) };
    }),
    fillStyle: "",
    strokeStyle: "",
    lineCap: "",
    lineJoin: "",
    lineWidth: 0,
    filter: "none",
  };

  return {
    ctx,
    fillRectCalls,
    beginPathCalls,
    strokeCalls,
    getImageDataCalls,
    saveRestoreCalls,
  };
}

describe("exportEditorCanvas", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let ctxMock: ReturnType<typeof makeCtxMock>;

  beforeEach(() => {
    ctxMock = makeCtxMock();

    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock.ctx),
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(new Blob(["png"], { type: "image/png" }));
      }),
    };

    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(canvasMock as unknown as HTMLElement);

    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
  });

  it("fill-black スタンプ領域を黒矩形で描画する", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "s1",
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        stampType: "fill-black",
        isEnabled: true,
        source: "manual",
      },
    ];
    await exportEditorCanvas(img, stampRegions, [], [], new Map());
    expect(ctxMock.ctx.fillStyle).toBe("#000000");
    expect(ctxMock.fillRectCalls.some(([x]) => x === 10)).toBe(true);
  });

  it("mosaic スタンプ領域でモザイク処理（getImageData）を呼び出す", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "s2",
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        stampType: "mosaic",
        isEnabled: true,
        source: "manual",
      },
    ];
    await exportEditorCanvas(img, stampRegions, [], [], new Map());
    expect(ctxMock.getImageDataCalls.length).toBeGreaterThan(0);
  });

  it("blur スタンプ領域でクリップ+フィルタを適用する", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "s3",
        x: 0,
        y: 0,
        width: 60,
        height: 60,
        stampType: "blur",
        isEnabled: true,
        source: "manual",
      },
    ];
    await exportEditorCanvas(img, stampRegions, [], [], new Map());
    expect(ctxMock.saveRestoreCalls).toContain("save");
    expect(ctxMock.saveRestoreCalls).toContain("restore");
  });

  it("無効な（isEnabled=false）領域はスキップされる", async () => {
    const img = makeImageElement(200, 200);
    const fillRegions: FillRegion[] = [
      {
        id: "f1",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        isEnabled: false,
        source: "manual",
      },
    ];
    const initialDrawCount = ctxMock.fillRectCalls.length;
    await exportEditorCanvas(img, [], fillRegions, [], new Map());
    expect(ctxMock.fillRectCalls.length).toBe(initialDrawCount);
  });

  it("有効な塗りつぶし領域を黒矩形で描画する", async () => {
    const img = makeImageElement(200, 200);
    const fillRegions: FillRegion[] = [
      {
        id: "f2",
        x: 5,
        y: 5,
        width: 40,
        height: 40,
        isEnabled: true,
        source: "ocr",
        text: "test@test.com",
      },
    ];
    await exportEditorCanvas(img, [], fillRegions, [], new Map());
    expect(ctxMock.fillRectCalls.some(([x]) => x === 5)).toBe(true);
  });

  it("ペイントストロークを描画する", async () => {
    const img = makeImageElement(200, 200);
    const paintStrokes: PaintStroke[] = [
      {
        id: "p1",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
        brushSize: 10,
        isEnabled: true,
      },
    ];
    await exportEditorCanvas(img, [], [], paintStrokes, new Map());
    expect(ctxMock.strokeCalls.length).toBeGreaterThan(0);
  });

  it("ポイントが1点のみのストロークはスキップされる", async () => {
    const img = makeImageElement(200, 200);
    const paintStrokes: PaintStroke[] = [
      {
        id: "p2",
        points: [{ x: 0, y: 0 }],
        brushSize: 10,
        isEnabled: true,
      },
    ];
    await exportEditorCanvas(img, [], [], paintStrokes, new Map());
    expect(ctxMock.strokeCalls.length).toBe(0);
  });
});
