import { describe, expect, it } from "vitest";
import { STAMP_FILE_NAMES } from "../constants";
import type { StampRegion } from "../types";
import { pickStampImage, resolveStampFileName } from "./pickStampImage";

describe("resolveStampFileName", () => {
  it("stampFileName があればそれを返す", () => {
    expect(
      resolveStampFileName({ id: "any", stampFileName: "custom.png" }, ["a.png", "b.png"])
    ).toBe("custom.png");
  });

  it("stampFileName が無ければ id ハッシュで決定的に選ぶ", () => {
    const fileNames = ["a.png", "b.png", "c.png"] as const;
    const first = resolveStampFileName({ id: "stable-id" }, fileNames);
    expect(fileNames).toContain(first);
    expect(resolveStampFileName({ id: "stable-id" }, fileNames)).toBe(first);
  });

  it("候補が空なら undefined", () => {
    expect(resolveStampFileName({ id: "x" }, [])).toBeUndefined();
  });
});

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

  it("stampFileName が無ければカタログ順の id ハッシュで選択する", () => {
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
    const expectedName = resolveStampFileName(region, STAMP_FILE_NAMES) ?? "";
    expect(expectedName).not.toBe("");
    const expectedImg = new Image();
    /** 意図的にカタログと異なる挿入順の Map でも、ハッシュ結果はカタログ順に従う */
    const map = new Map<string, HTMLImageElement>();
    for (const name of [...STAMP_FILE_NAMES].reverse()) {
      map.set(name, name === expectedName ? expectedImg : new Image());
    }
    expect(pickStampImage(region, map)).toBe(expectedImg);
    expect(pickStampImage(region, map)).toBe(expectedImg);
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

  it("カタログ既定では STAMP_FILE_NAMES と整合する", () => {
    const id = "face-region-1";
    const expected = resolveStampFileName({ id }, STAMP_FILE_NAMES) ?? "";
    expect(expected).not.toBe("");
    const img = new Image();
    const map = new Map([[expected, img]]);
    const region: StampRegion = {
      id,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      stampType: "stamp-face",
      isEnabled: true,
      source: "face-detection",
    };
    expect(pickStampImage(region, map)).toBe(img);
  });
});
