import { describe, expect, it } from "vitest";
import {
  VIEW_ZOOM,
  clampViewPan,
  clampViewZoom,
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

describe("clampViewPan", () => {
  it("等倍では常に 0", () => {
    expect(clampViewPan({ x: 50, y: -30 }, 100, 80, 1)).toEqual({ x: 0, y: 0 });
  });

  it("2 倍ズーム時はステージ幅の半分まで許容する", () => {
    const w = 200;
    const h = 100;
    const z = 2;
    expect(clampViewPan({ x: 200, y: 0 }, w, h, z)).toEqual({ x: 100, y: 0 });
    expect(clampViewPan({ x: -200, y: 0 }, w, h, z)).toEqual({ x: -100, y: 0 });
  });
});

describe("stagePointerToContentSpace", () => {
  it("等倍でパンなしでは座標を変えない", () => {
    const p = { x: 10, y: 20 };
    expect(stagePointerToContentSpace(p, 100, 80, 1)).toEqual(p);
  });

  it("等倍でパンありではステージ座標からパンを差し引く", () => {
    const p = { x: 10, y: 20 };
    expect(stagePointerToContentSpace(p, 100, 80, 1, { x: 3, y: 4 })).toEqual({ x: 7, y: 16 });
  });

  it("ステージ中心を通る点はズーム後もコンテンツ中心と一致する", () => {
    const w = 200;
    const h = 100;
    const center = { x: w / 2, y: h / 2 };
    expect(stagePointerToContentSpace(center, w, h, 2)).toEqual(center);
  });

  it("2 倍ズーム時、ステージ左上はコンテンツ上で中心より左上に射影される", () => {
    const w = 200;
    const h = 200;
    const z = 2;
    const out = stagePointerToContentSpace({ x: 0, y: 0 }, w, h, z);
    expect(out.x).toBeCloseTo(50);
    expect(out.y).toBeCloseTo(50);
  });
});
