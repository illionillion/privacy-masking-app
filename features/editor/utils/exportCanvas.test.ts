import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exportEditorCanvas } from "./exportCanvas";
import type { PaintStroke, StampRegion } from "../types";

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
  const translateCalls: [number, number][] = [];
  const rotateCalls: number[] = [];

  const ctx = {
    canvas: { width: 200, height: 200 } as HTMLCanvasElement,
    drawImage: vi.fn(),
    fillRect: vi.fn((...args: number[]) => fillRectCalls.push(args as FillRectCall)),
    beginPath: vi.fn(() => beginPathCalls.push(1)),
    moveTo: vi.fn((...args: number[]) => moveToCalls.push(args as [number, number])),
    lineTo: vi.fn((...args: number[]) => lineToCalls.push(args as [number, number])),
    stroke: vi.fn(() => strokeCalls.push(1)),
    rect: vi.fn(),
    clip: vi.fn(),
    translate: vi.fn((...args: number[]) => translateCalls.push(args as [number, number])),
    rotate: vi.fn((angle: number) => rotateCalls.push(angle)),
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
    translateCalls,
    rotateCalls,
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

    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
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
    await exportEditorCanvas(img, stampRegions, [], new Map());
    expect(ctxMock.ctx.fillStyle).toBe("#000000");
    expect(ctxMock.translateCalls.some(([x, y]) => x === 10 && y === 10)).toBe(true);
    expect(
      ctxMock.fillRectCalls.some(([x, y, w, h]) => x === 0 && y === 0 && w === 50 && h === 50)
    ).toBe(true);
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
    await exportEditorCanvas(img, stampRegions, [], new Map());
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
    await exportEditorCanvas(img, stampRegions, [], new Map());
    expect(ctxMock.saveRestoreCalls).toContain("save");
    expect(ctxMock.saveRestoreCalls).toContain("restore");
  });

  it("stamp-face は stampFileName で指定した画像を優先して描画する", async () => {
    const img = makeImageElement(200, 200);
    const stampA = { width: 64, height: 64 } as HTMLImageElement;
    const stampB = { width: 64, height: 64 } as HTMLImageElement;
    const stampRegions: StampRegion[] = [
      {
        id: "s4",
        x: 20,
        y: 20,
        width: 40,
        height: 30,
        stampType: "stamp-face",
        stampFileName: "b.png",
        isEnabled: true,
        source: "manual",
      },
    ];
    const stampImages = new Map<string, HTMLImageElement>([
      ["a.png", stampA],
      ["b.png", stampB],
    ]);

    await exportEditorCanvas(img, stampRegions, [], stampImages);
    const drawImageCalls = vi.mocked(ctxMock.ctx.drawImage).mock.calls;
    // 1回目は背景画像描画、2回目がスタンプ描画
    expect(drawImageCalls[1]?.[0]).toBe(stampB);
  });

  it("無効な（isEnabled=false）マスキング領域はスキップされる", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "f1",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        stampType: "fill-black",
        isEnabled: false,
        source: "ocr",
      },
    ];
    const initialDrawCount = ctxMock.fillRectCalls.length;
    await exportEditorCanvas(img, stampRegions, [], new Map());
    expect(ctxMock.fillRectCalls.length).toBe(initialDrawCount);
  });

  it("OCR 由来の fill-black 領域を黒矩形で描画する", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "f2",
        x: 5,
        y: 5,
        width: 40,
        height: 40,
        stampType: "fill-black",
        isEnabled: true,
        source: "ocr",
        text: "test@test.com",
      },
    ];
    await exportEditorCanvas(img, stampRegions, [], new Map());
    expect(ctxMock.translateCalls.some(([x, y]) => x === 5 && y === 5)).toBe(true);
    expect(
      ctxMock.fillRectCalls.some(([x, y, w, h]) => x === 0 && y === 0 && w === 40 && h === 40)
    ).toBe(true);
  });

  it("rotation 付き fill-black は rotate を適用する", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "s-rot",
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        rotation: 45,
        stampType: "fill-black",
        isEnabled: true,
        source: "manual",
      },
    ];
    await exportEditorCanvas(img, stampRegions, [], new Map());
    expect(ctxMock.translateCalls.some(([x, y]) => x === 10 && y === 20)).toBe(true);
    expect(ctxMock.rotateCalls.some((rad) => Math.abs(rad - Math.PI / 4) < 1e-9)).toBe(true);
    expect(
      ctxMock.fillRectCalls.some(([x, y, w, h]) => x === 0 && y === 0 && w === 30 && h === 40)
    ).toBe(true);
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
    await exportEditorCanvas(img, [], paintStrokes, new Map());
    expect(ctxMock.strokeCalls.length).toBeGreaterThan(0);
  });

  it("cropRect があるときソース矩形で切り出してキャンバスサイズを合わせる", async () => {
    const img = makeImageElement(200, 200);
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctxMock.ctx),
      toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
        cb(new Blob(["png"], { type: "image/png" }));
      }),
    };
    createElementSpy.mockReturnValue(canvasMock as unknown as HTMLElement);

    await exportEditorCanvas(img, [], [], new Map(), { x: 40, y: 50, width: 80, height: 60 });

    expect(canvasMock.width).toBe(80);
    expect(canvasMock.height).toBe(60);
    expect(ctxMock.ctx.drawImage).toHaveBeenCalledWith(img, 40, 50, 80, 60, 0, 0, 80, 60);
  });

  it("cropRect があるときスタンプ座標をソース原点基準にずらす", async () => {
    const img = makeImageElement(200, 200);
    const stampRegions: StampRegion[] = [
      {
        id: "s-crop",
        x: 50,
        y: 60,
        width: 20,
        height: 20,
        stampType: "fill-black",
        isEnabled: true,
        source: "manual",
      },
    ];
    await exportEditorCanvas(img, stampRegions, [], new Map(), {
      x: 40,
      y: 50,
      width: 80,
      height: 60,
    });
    expect(ctxMock.translateCalls.some(([x, y]) => x === 10 && y === 10)).toBe(true);
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
    await exportEditorCanvas(img, [], paintStrokes, new Map());
    expect(ctxMock.strokeCalls.length).toBe(0);
  });
});
