import { describe, expect, it } from "vitest";
import {
  getStampRegionRotationDeg,
  MIN_STAMP_REGION_SIZE,
  stampRegionUpdatesFromTransformEnd,
} from "./stampRegionTransform";

describe("stampRegionUpdatesFromTransformEnd", () => {
  it("scale を width/height に焼き込み rotation を保持する（AABB は使わない）", () => {
    const updates = stampRegionUpdatesFromTransformEnd(
      { width: 100, height: 50 },
      { x: 20, y: 40, scaleX: 2, scaleY: 1.5, rotation: 45 },
      2,
      2
    );
    expect(updates).toEqual({
      x: 10,
      y: 20,
      width: 200,
      height: 75,
      rotation: 45,
    });
  });

  it("負の scale は絶対値でサイズ化する", () => {
    const updates = stampRegionUpdatesFromTransformEnd(
      { width: 40, height: 40 },
      { x: 0, y: 0, scaleX: -0.5, scaleY: -2, rotation: -30 },
      1,
      1
    );
    expect(updates.width).toBe(20);
    expect(updates.height).toBe(80);
    expect(updates.rotation).toBe(-30);
  });

  it("極小サイズは下限でクランプする", () => {
    const updates = stampRegionUpdatesFromTransformEnd(
      { width: 10, height: 10 },
      { x: 0, y: 0, scaleX: 0.01, scaleY: 0.01, rotation: 0 },
      1,
      1
    );
    expect(updates.width).toBe(MIN_STAMP_REGION_SIZE);
    expect(updates.height).toBe(MIN_STAMP_REGION_SIZE);
  });
});

describe("getStampRegionRotationDeg", () => {
  it("未設定は 0", () => {
    expect(getStampRegionRotationDeg({})).toBe(0);
  });

  it("設定値を返す", () => {
    expect(getStampRegionRotationDeg({ rotation: 90 })).toBe(90);
  });
});
