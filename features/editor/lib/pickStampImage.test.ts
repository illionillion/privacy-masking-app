import { describe, expect, it } from "vitest";
import type { StampRegion } from "../types";
import { pickStampImage } from "./pickStampImage";

describe("pickStampImage", () => {
  it("stampFileName があればそのキーの画像を返す", () => {
    const img = new Image();
    const region: StampRegion = {
      id: "a",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      stampType: "stamp-face",
      stampFileName: "face.png",
      isEnabled: true,
      source: "manual",
    };
    const map = new Map([["face.png", img]]);
    expect(pickStampImage(region, map)).toBe(img);
  });

  it("stampFileName が無ければ id ハッシュで決定的に選択する", () => {
    const img0 = new Image();
    const img1 = new Image();
    const region: StampRegion = {
      id: "stable-id",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      stampType: "stamp-face",
      isEnabled: true,
      source: "manual",
    };
    const map = new Map<string, HTMLImageElement>([
      ["a", img0],
      ["b", img1],
    ]);
    const first = pickStampImage(region, map);
    expect([img0, img1]).toContain(first);
    expect(pickStampImage(region, map)).toBe(first);
  });

  it("マップが空なら null", () => {
    const region: StampRegion = {
      id: "x",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      stampType: "stamp-face",
      isEnabled: true,
      source: "manual",
    };
    expect(pickStampImage(region, new Map())).toBeNull();
  });
});
