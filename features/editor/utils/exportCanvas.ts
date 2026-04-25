import { MAX_CANVAS_DIMENSION } from "@/lib/canvas";
import type { FillRegion, PaintStroke, StampRegion } from "../types";

/** モザイクブロックの最小サイズ（px） */
const MIN_MOSAIC_BLOCK_SIZE = 3;

/** モザイクブロックサイズ算出用の除数（短辺に対する割合の逆数） */
const MOSAIC_BLOCK_SIZE_DIVISOR = 24;

/** ぼかし半径の最小値（px） */
const MIN_BLUR_RADIUS = 4;

/** ぼかし半径算出用の除数（短辺に対する割合の逆数） */
const BLUR_RADIUS_DIVISOR = 8;

/**
 * モザイク処理を Canvas に適用する
 *
 * @param ctx - 2D コンテキスト
 * @param x - 矩形の X 座標
 * @param y - 矩形の Y 座標
 * @param width - 矩形の幅
 * @param height - 矩形の高さ
 */
function applyMosaic(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const blockSize = Math.max(
    MIN_MOSAIC_BLOCK_SIZE,
    Math.round(Math.min(width, height) / MOSAIC_BLOCK_SIZE_DIVISOR)
  );
  const imageData = ctx.getImageData(x, y, width, height);
  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const px = Math.min(bx + Math.floor(blockSize / 2), width - 1);
      const py = Math.min(by + Math.floor(blockSize / 2), height - 1);
      const idx = (py * width + px) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        x + bx,
        y + by,
        Math.min(blockSize, width - bx),
        Math.min(blockSize, height - by)
      );
    }
  }
}

/**
 * ぼかし処理を Canvas に適用する
 *
 * @param ctx - 2D コンテキスト
 * @param imageSource - 元画像要素
 * @param x - 矩形の X 座標
 * @param y - 矩形の Y 座標
 * @param width - 矩形の幅
 * @param height - 矩形の高さ
 * @param scaleX - X 方向スケール
 * @param scaleY - Y 方向スケール
 */
function applyBlur(
  ctx: CanvasRenderingContext2D,
  imageSource: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  scaleX: number,
  scaleY: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  const blurRadius = Math.max(
    MIN_BLUR_RADIUS,
    Math.round(Math.min(width, height) / BLUR_RADIUS_DIVISOR)
  );
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.drawImage(
    imageSource,
    0,
    0,
    Math.round(imageSource.width * scaleX),
    Math.round(imageSource.height * scaleY)
  );
  ctx.filter = "none";
  ctx.restore();
}

/**
 * エディタの現在状態を PNG Blob URL としてエクスポートする
 *
 * 座標はすべて元画像ピクセル空間で管理され、
 * Canvas の最大辺が MAX_CANVAS_DIMENSION を超える場合はスケールダウンする。
 *
 * @param imageElement - 元画像の HTMLImageElement
 * @param stampRegions - スタンプ領域の配列
 * @param fillRegions - 塗りつぶし領域の配列
 * @param paintStrokes - ペイントストロークの配列
 * @param stampImages - ファイル名をキーにした画像マップ（stamp-face 用）
 * @returns PNG の Blob URL
 */
export async function exportEditorCanvas(
  imageElement: HTMLImageElement,
  stampRegions: StampRegion[],
  fillRegions: FillRegion[],
  paintStrokes: PaintStroke[],
  stampImages: Map<string, HTMLImageElement>
): Promise<string> {
  const scale = Math.min(
    1,
    MAX_CANVAS_DIMENSION / Math.max(imageElement.width, imageElement.height)
  );
  const canvasWidth = Math.round(imageElement.width * scale);
  const canvasHeight = Math.round(imageElement.height * scale);
  const scaleX = canvasWidth / imageElement.width;
  const scaleY = canvasHeight / imageElement.height;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  ctx.drawImage(imageElement, 0, 0, canvasWidth, canvasHeight);

  /** 有効な塗りつぶし領域を黒矩形で描画 */
  for (const region of fillRegions) {
    if (!region.isEnabled) continue;
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      Math.round(region.x * scaleX),
      Math.round(region.y * scaleY),
      Math.round(region.width * scaleX),
      Math.round(region.height * scaleY)
    );
  }

  /** 有効なスタンプ領域をマスキング種別に応じて描画 */
  for (const region of stampRegions) {
    if (!region.isEnabled) continue;
    const sx = Math.round(region.x * scaleX);
    const sy = Math.round(region.y * scaleY);
    const sw = Math.round(region.width * scaleX);
    const sh = Math.round(region.height * scaleY);

    switch (region.stampType) {
      case "fill-black":
        ctx.fillStyle = "#000000";
        ctx.fillRect(sx, sy, sw, sh);
        break;

      case "mosaic":
        applyMosaic(ctx, sx, sy, sw, sh);
        break;

      case "blur":
        applyBlur(ctx, imageElement, sx, sy, sw, sh, scaleX, scaleY);
        break;

      case "stamp-face": {
        const stampImagesArray = Array.from(stampImages.values());
        if (stampImagesArray.length > 0) {
          /**
           * region.id のハッシュを使って決定的にスタンプを選択する。
           * ランダム選択では毎エクスポートで結果が変わるため、IDベースのハッシュで固定する。
           */
          const idHash = region.id
            .split("")
            .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
          const stampIndex = Math.abs(idHash) % stampImagesArray.length;
          const stamp = stampImagesArray[stampIndex];
          const centerX = sx + sw / 2;
          const centerY = sy + sh / 2;
          const stampSize = Math.max(sw, sh);
          ctx.drawImage(
            stamp,
            centerX - stampSize / 2,
            centerY - stampSize / 2,
            stampSize,
            stampSize
          );
        } else {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(sx, sy, sw, sh);
        }
        break;
      }
    }
  }

  /** 有効なペイントストロークを黒の丸いラインで描画 */
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000000";
  for (const stroke of paintStrokes) {
    if (!stroke.isEnabled || stroke.points.length < 2) continue;
    ctx.lineWidth = stroke.brushSize * scaleX;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY);
    }
    ctx.stroke();
  }

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create blob"));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}
