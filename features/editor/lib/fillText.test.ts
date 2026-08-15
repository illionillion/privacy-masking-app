import { describe, it, expect } from "vitest";
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_OVERLAY_TEXT,
  DEFAULT_TEXT_COLOR,
  MIN_FILL_TEXT_FONT_SIZE,
  computeFillTextFontSize,
  hasTransparentBackground,
  resolveBackgroundColor,
  resolveOverlayText,
  resolveTextColor,
} from "./fillText";

describe("resolveOverlayText", () => {
  it("未設定はデフォルト文言を返す", () => {
    expect(resolveOverlayText({})).toBe(DEFAULT_OVERLAY_TEXT);
  });

  it("空白のみはデフォルト文言を返す", () => {
    expect(resolveOverlayText({ overlayText: "   " })).toBe(DEFAULT_OVERLAY_TEXT);
  });

  it("設定済みはその文言を返す", () => {
    expect(resolveOverlayText({ overlayText: "非公開" })).toBe("非公開");
  });
});

describe("resolveTextColor / resolveBackgroundColor", () => {
  it("未設定はデフォルト色を返す", () => {
    expect(resolveTextColor({})).toBe(DEFAULT_TEXT_COLOR);
    expect(resolveBackgroundColor({})).toBe(DEFAULT_BACKGROUND_COLOR);
  });

  it("設定済みはその色を返す", () => {
    expect(resolveTextColor({ textColor: "#ff0000" })).toBe("#ff0000");
    expect(resolveBackgroundColor({ backgroundColor: "#00ff00" })).toBe("#00ff00");
  });
});

describe("hasTransparentBackground", () => {
  it("未設定は塗りつぶす（false）", () => {
    expect(hasTransparentBackground({})).toBe(false);
  });

  it("false 指定は塗りつぶす", () => {
    expect(hasTransparentBackground({ isBackgroundTransparent: false })).toBe(false);
  });

  it("true 指定は透過する", () => {
    expect(hasTransparentBackground({ isBackgroundTransparent: true })).toBe(true);
  });
});

describe("computeFillTextFontSize", () => {
  it("横に余裕があるときは高さ制約で決まる", () => {
    expect(computeFillTextFontSize(1000, 120, "あ")).toBeCloseTo((120 * 0.8) / 1.2, 5);
  });

  it("横が詰まっているときは幅・文字数制約で決まる", () => {
    const size = computeFillTextFontSize(100, 1000, "あいうえお");
    expect(size).toBeCloseTo((100 * 0.9) / (5 * 0.62), 5);
  });

  it("領域を広げるとフォントサイズも大きくなる", () => {
    const small = computeFillTextFontSize(100, 40, "個人情報");
    const large = computeFillTextFontSize(200, 80, "個人情報");
    expect(large).toBeGreaterThan(small);
  });

  it("極端に小さい領域では下限でクランプされる", () => {
    expect(computeFillTextFontSize(1, 1, "あいうえおかきくけこ")).toBe(MIN_FILL_TEXT_FONT_SIZE);
  });

  it("空文字でも 1 文字扱いで算出できる", () => {
    expect(computeFillTextFontSize(1000, 100, "")).toBeGreaterThanOrEqual(MIN_FILL_TEXT_FONT_SIZE);
  });
});
