import { describe, expect, it } from "vitest";
import {
  VIEW_ZOOM,
  clampViewCenter,
  clampViewZoom,
  computeViewCenterAfterZoomAt,
  getDefaultViewCenter,
  panViewCenterByStageDelta,
  roundViewZoomStep,
  stagePointerToContentSpace,
  normalizeWheelDeltaY,
  wheelEventToZoomDelta,
  WHEEL_ZOOM_DELTA_CAP,
  WHEEL_PIXELS_PER_ZOOM_STEP,
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

describe("computeViewCenterAfterZoomAt", () => {
  it("ズーム後もステージ中心の下の画像点が同じコンテンツ座標に対応する", () => {
    const w = 200;
    const h = 100;
    const scale = 1;
    const center = { x: 100, y: 50 };
    const stageCenter = { x: w / 2, y: h / 2 };
    const before = stagePointerToContentSpace(stageCenter, w, h, 1, {
      x: center.x * scale,
      y: center.y * scale,
    });
    const afterCenter = computeViewCenterAfterZoomAt(
      center,
      stageCenter,
      w,
      h,
      scale,
      scale,
      1,
      2,
      w,
      h
    );
    const after = stagePointerToContentSpace(stageCenter, w, h, 2, {
      x: afterCenter.x * scale,
      y: afterCenter.y * scale,
    });
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });
});

describe("panViewCenterByStageDelta", () => {
  it("ステージ右ドラッグで表示中心が左へ移動する", () => {
    const w = 400;
    const h = 200;
    const z = 2;
    const start = { x: 200, y: 100 };
    const next = panViewCenterByStageDelta(start, { x: 24, y: 0 }, 1, 1, z, w, h);
    expect(next.x).toBeCloseTo(start.x - 24 / z);
    expect(next.y).toBe(start.y);
  });
});

describe("wheelEventToZoomDelta", () => {
  it("下スクロールで縮小・上スクロールで拡大", () => {
    expect(wheelEventToZoomDelta(45, 0)).toBeCloseTo(-0.05);
    expect(wheelEventToZoomDelta(-45, 0)).toBeCloseTo(0.05);
  });

  it("大きな delta は 1 イベントあたりの上限でクランプする", () => {
    expect(wheelEventToZoomDelta(500, 0)).toBe(-WHEEL_ZOOM_DELTA_CAP);
    expect(wheelEventToZoomDelta(-500, 0)).toBe(WHEEL_ZOOM_DELTA_CAP);
  });

  it("トラックパッドの細かい delta は比例して小さく変化する", () => {
    const small = wheelEventToZoomDelta(6, 0);
    expect(small).toBeCloseTo(-6 / WHEEL_PIXELS_PER_ZOOM_STEP / 10);
    expect(Math.abs(small)).toBeLessThan(WHEEL_ZOOM_DELTA_CAP);
  });
});

describe("normalizeWheelDeltaY", () => {
  it("LINE モードは 16 倍してピクセル相当にする", () => {
    expect(normalizeWheelDeltaY(3, 1)).toBe(48);
  });
});
