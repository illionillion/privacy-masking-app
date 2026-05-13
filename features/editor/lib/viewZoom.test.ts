import { describe, expect, it } from "vitest";
import {
  VIEW_ZOOM,
  clampViewCenter,
  clampViewZoom,
  getDefaultViewCenter,
  roundViewZoomStep,
  stagePointerToContentSpace,
} from "./viewZoom";

describe("clampViewZoom", () => {
  it("範囲内はそのまま返す", () => {
    expect(clampViewZoom(1)).toBe(1);
    expect(clampViewZoom(2)).toBe(2);
  });

  it("下限・上限でクランプする", () => {
    expect(clampViewZoom(0)).toBe(VIEW_ZOOM.min);
    expect(clampViewZoom(10)).toBe(VIEW_ZOOM.max);
  });
});

describe("roundViewZoomStep", () => {
  it("0.1 刻みに丸めてからクランプする", () => {
    expect(roundViewZoomStep(1.04)).toBe(1);
    expect(roundViewZoomStep(1.05)).toBe(1.1);
  });
});

describe("getDefaultViewCenter", () => {
  it("画像中央を返す", () => {
    expect(getDefaultViewCenter(100, 80)).toEqual({ x: 50, y: 40 });
  });
});

describe("clampViewCenter", () => {
  it("等倍以下では常に画像中央に戻す", () => {
    expect(clampViewCenter({ x: 10, y: 20 }, 100, 80, 1)).toEqual({ x: 50, y: 40 });
    expect(clampViewCenter({ x: 10, y: 20 }, 100, 80, 0.5)).toEqual({ x: 50, y: 40 });
  });

  it("2 倍ズーム時は画像の外側を見ない範囲へ収める", () => {
    const w = 400;
    const h = 200;
    const z = 2;
    expect(clampViewCenter({ x: 10, y: 10 }, w, h, z)).toEqual({ x: 100, y: 50 });
    expect(clampViewCenter({ x: 390, y: 190 }, w, h, z)).toEqual({ x: 300, y: 150 });
  });
});

describe("stagePointerToContentSpace", () => {
  it("等倍で contentCenter がステージ中央なら座標を変えない", () => {
    const p = { x: 10, y: 20 };
    expect(stagePointerToContentSpace(p, 100, 80, 1)).toEqual(p);
  });

  it("表示中心がずれているときはステージ中央がその contentCenter に対応する", () => {
    const center = { x: 120, y: 90 };
    expect(stagePointerToContentSpace({ x: 100, y: 50 }, 200, 100, 1, center)).toEqual(center);
  });

  it("ステージ中心を通る点はズーム後もコンテンツ中心と一致する", () => {
    const w = 200;
    const h = 100;
    const contentCenter = { x: 140, y: 80 };
    expect(stagePointerToContentSpace({ x: w / 2, y: h / 2 }, w, h, 2, contentCenter)).toEqual(
      contentCenter
    );
  });

  it("2 倍ズーム時、ステージ左上はコンテンツ上で中心より左上に射影される", () => {
    const w = 200;
    const h = 200;
    const z = 2;
    const out = stagePointerToContentSpace({ x: 0, y: 0 }, w, h, z, { x: 150, y: 130 });
    expect(out.x).toBeCloseTo(100);
    expect(out.y).toBeCloseTo(80);
  });
});
