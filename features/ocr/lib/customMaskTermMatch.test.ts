import { describe, it, expect } from "vitest";
import {
  buildCollapsedTextIndex,
  detectCustomMaskTermsInWordGroup,
  findWhitespaceFlexibleTermRanges,
  stripWhitespaceForMatch,
} from "./customMaskTermMatch";

const bbox = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 });

describe("customMaskTermMatch", () => {
  it("空白を除去して比較用文字列を作る", () => {
    expect(stripWhitespaceForMatch("山田　太郎")).toBe("山田太郎");
    expect(stripWhitespaceForMatch("山田 太郎")).toBe("山田太郎");
  });

  it("OCR 行の空白差を無視して語句位置を見つける", () => {
    expect(findWhitespaceFlexibleTermRanges("山田 太郎", "山田太郎")).toEqual([
      { start: 0, end: 5 },
    ]);
    expect(findWhitespaceFlexibleTermRanges("山田 太郎", "山田　太郎")).toEqual([
      { start: 0, end: 5 },
    ]);
  });

  it("分割された単語から登録語句を検出する", () => {
    const words = [
      { text: "山田", bbox: bbox(0, 0, 40, 20) },
      { text: "太郎", bbox: bbox(45, 0, 90, 20) },
    ];
    const matchedRanges: Array<{ start: number; end: number }> = [];
    const regions = detectCustomMaskTermsInWordGroup(words, ["山田太郎"], matchedRanges);

    expect(regions).toHaveLength(1);
    expect(regions[0]?.text).toBe("山田太郎");
    expect(regions[0]?.patternType).toBe("custom");
    expect(regions[0]?.x).toBe(0);
    expect(regions[0]?.width).toBe(90);
  });

  it("登録語句に空白があっても検出できる", () => {
    const words = [{ text: "山田太郎", bbox: bbox(0, 0, 80, 20) }];
    const regions = detectCustomMaskTermsInWordGroup(words, ["山田　太郎"], []);

    expect(regions).toHaveLength(1);
    expect(regions[0]?.text).toBe("山田　太郎");
  });

  it("collapsed インデックスが元テキスト位置と対応する", () => {
    const { collapsed, startIndices } = buildCollapsedTextIndex("山田 太郎");
    expect(collapsed).toBe("山田太郎");
    expect(startIndices).toEqual([0, 1, 3, 4]);
  });
});
