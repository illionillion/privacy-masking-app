import { describe, expect, it } from "vitest";
import {
  areCropRectsEqual,
  clampCropRect,
  createFullImageCropRect,
  isFullImageCrop,
  MIN_CROP_SIZE,
  normalizeAppliedCropRect,
  resolveExportSourceRect,
} from "./cropRect";

describe("createFullImageCropRect", () => {
  it("原点から画像全体の矩形を返す", () => {
    expect(createFullImageCropRect(800, 600)).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });
});

describe("isFullImageCrop", () => {
  it("画像全体なら true", () => {
    expect(isFullImageCrop({ x: 0, y: 0, width: 100, height: 50 }, 100, 50)).toBe(true);
  });

  it("一部だけなら false", () => {
    expect(isFullImageCrop({ x: 10, y: 0, width: 90, height: 50 }, 100, 50)).toBe(false);
  });

  it("小数の誤差はフル画像とみなす", () => {
    expect(isFullImageCrop({ x: 0.2, y: -0.1, width: 99.8, height: 50.2 }, 100, 50)).toBe(true);
  });
});

describe("clampCropRect", () => {
  it("画像外にはみ出したら内側へ戻す", () => {
    expect(clampCropRect({ x: 80, y: 80, width: 50, height: 50 }, 100, 100)).toEqual({
      x: 50,
      y: 50,
      width: 50,
      height: 50,
    });
  });

  it("最小サイズ未満は引き上げる", () => {
    const clamped = clampCropRect({ x: 0, y: 0, width: 2, height: 2 }, 100, 100);
    expect(clamped.width).toBe(MIN_CROP_SIZE);
    expect(clamped.height).toBe(MIN_CROP_SIZE);
  });

  it("画像が最小サイズより小さいときは画像辺に合わせる", () => {
    expect(clampCropRect({ x: 0, y: 0, width: 1, height: 1 }, 8, 10)).toEqual({
      x: 0,
      y: 0,
      width: 8,
      height: 10,
    });
  });

  it("幅・高さが 0 以下の画像はゼロ矩形", () => {
    expect(clampCropRect({ x: 1, y: 1, width: 10, height: 10 }, 0, 0)).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  });
});

describe("normalizeAppliedCropRect", () => {
  it("フル画像は null", () => {
    expect(normalizeAppliedCropRect({ x: 0, y: 0, width: 200, height: 100 }, 200, 100)).toBeNull();
  });

  it("部分 crop は clamp した矩形", () => {
    expect(normalizeAppliedCropRect({ x: 10, y: 20, width: 80, height: 60 }, 200, 100)).toEqual({
      x: 10,
      y: 20,
      width: 80,
      height: 60,
    });
  });
});

describe("resolveExportSourceRect", () => {
  it("null / undefined は画像全体", () => {
    expect(resolveExportSourceRect(120, 80, null)).toEqual({ x: 0, y: 0, width: 120, height: 80 });
    expect(resolveExportSourceRect(120, 80, undefined)).toEqual({
      x: 0,
      y: 0,
      width: 120,
      height: 80,
    });
  });

  it("指定があれば clamp する", () => {
    expect(resolveExportSourceRect(100, 100, { x: 90, y: 90, width: 40, height: 40 })).toEqual({
      x: 60,
      y: 60,
      width: 40,
      height: 40,
    });
  });
});

describe("areCropRectsEqual", () => {
  it("null 同士は等しい", () => {
    expect(areCropRectsEqual(null, null)).toBe(true);
  });

  it("null と矩形は等しくない", () => {
    expect(areCropRectsEqual(null, { x: 0, y: 0, width: 1, height: 1 })).toBe(false);
  });

  it("同じ値なら等しい", () => {
    expect(
      areCropRectsEqual({ x: 1, y: 2, width: 3, height: 4 }, { x: 1, y: 2, width: 3, height: 4 })
    ).toBe(true);
  });

  it("値が違えば等しくない", () => {
    expect(
      areCropRectsEqual({ x: 1, y: 2, width: 3, height: 4 }, { x: 1, y: 2, width: 3, height: 5 })
    ).toBe(false);
  });
});
