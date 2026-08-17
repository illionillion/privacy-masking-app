import { describe, expect, it } from "vitest";
import {
  computePaintBlurRadius,
  computePaintMosaicBlockSize,
  computePaintStrokeBounds,
  MIN_PAINT_BLUR_RADIUS,
  MIN_PAINT_MOSAIC_BLOCK_SIZE,
  resolvePaintType,
} from "./paintStroke";

describe("resolvePaintType", () => {
  it("未設定は黒塗りとして扱う", () => {
    expect(resolvePaintType({})).toBe("fill-black");
  });

  it("設定済みの種別をそのまま返す", () => {
    expect(resolvePaintType({ paintType: "mosaic" })).toBe("mosaic");
  });
});

describe("computePaintMosaicBlockSize", () => {
  it("ブラシ幅に比例したブロックサイズを返す", () => {
    expect(computePaintMosaicBlockSize(50)).toBe(10);
    expect(computePaintMosaicBlockSize(200)).toBe(40);
  });

  it("細いブラシでも最小サイズを下回らない", () => {
    expect(computePaintMosaicBlockSize(1)).toBe(MIN_PAINT_MOSAIC_BLOCK_SIZE);
  });

  it("ブラシ幅が同じ比率なら座標系が違ってもブロック比が一致する", () => {
    /* 表示 40px と書き出し 400px（10 倍スケール）でブロック比が揃う */
    expect(computePaintMosaicBlockSize(400) / computePaintMosaicBlockSize(40)).toBe(10);
  });
});

describe("computePaintBlurRadius", () => {
  it("ブラシ幅に比例したぼかし半径を返す", () => {
    expect(computePaintBlurRadius(80)).toBe(10);
  });

  it("細いブラシでも最小半径を下回らない", () => {
    expect(computePaintBlurRadius(1)).toBe(MIN_PAINT_BLUR_RADIUS);
  });
});

describe("computePaintStrokeBounds", () => {
  it("ブラシ幅ぶんの余白を含めた外接矩形を返す", () => {
    const bounds = computePaintStrokeBounds(
      [
        { x: 100, y: 100 },
        { x: 140, y: 120 },
      ],
      20,
      1000,
      1000
    );
    expect(bounds).toEqual({ x: 82, y: 82, width: 76, height: 56 });
  });

  it("キャンバス範囲を超えないようにクランプする", () => {
    const bounds = computePaintStrokeBounds(
      [
        { x: 5, y: 5 },
        { x: 95, y: 95 },
      ],
      40,
      100,
      100
    );
    expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});
