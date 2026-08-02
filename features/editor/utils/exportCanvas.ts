import { MAX_CANVAS_DIMENSION } from "@/lib/canvas";
import { pickStampImage } from "../lib/pickStampImage";
import { getStampRegionRotationDeg } from "../lib/stampRegionTransform";
import type { PaintStroke, StampRegion } from "../types";

/** モザイクブロックの最小サイズ（px） */
const MIN_MOSAIC_BLOCK_SIZE = 3;

/** モザイクブロックサイズ算出用の除数（短辺に対する割合の逆数） */
const MOSAIC_BLOCK_SIZE_DIVISOR = 24;

/** ぼかし半径の最小値（px） */
const MIN_BLUR_RADIUS = 4;

/** ぼかし半径算出用の除数（短辺に対する割合の逆数） */
const BLUR_RADIUS_DIVISOR = 8;

/**
 * stamp-face 用の画像を選択する
 *
 * stampFileName が設定されている場合はそれを最優先し、
 * 未設定時のみ region.id ハッシュで決定的に選択する。
 */
function pickExportStampImage(
  region: StampRegion,
  stampImages: Map<string, HTMLImageElement>
): HTMLImageElement | null {
  return pickStampImage(region, stampImages);
}

/**
 * モザイク処理を Canvas に適用する（軸平行のローカル矩形向け）
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
 * 回転を考慮してモザイクを適用する
 *
 * ローカル矩形へ逆変換サンプリング → モザイク → 回転して描画する。
 */
function applyMosaicRotated(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  rotationDeg: number
): void {
  const width = Math.max(1, Math.round(sw));
  const height = Math.max(1, Math.round(sh));
  const rad = (rotationDeg * Math.PI) / 180;
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  offCtx.save();
  offCtx.rotate(-rad);
  offCtx.translate(-sx, -sy);
  offCtx.drawImage(ctx.canvas, 0, 0);
  offCtx.restore();

  applyMosaic(offCtx, 0, 0, width, height);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(rad);
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
}

/**
 * ぼかし処理を Canvas に適用する
 *
 * @param ctx - 2D コンテキスト
 * @param imageSource - 元画像要素
 * @param x - 矩形の X 座標（キャンバス空間、回転前の左上）
 * @param y - 矩形の Y 座標
 * @param width - 矩形の幅
 * @param height - 矩形の高さ
 * @param scaleX - X 方向スケール
 * @param scaleY - Y 方向スケール
 * @param rotationDeg - 回転角（度）。左上原点
 */
function applyBlur(
  ctx: CanvasRenderingContext2D,
  imageSource: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  scaleX: number,
  scaleY: number,
  rotationDeg = 0
): void {
  const rad = (rotationDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rad);
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.clip();
  ctx.rotate(-rad);
  ctx.translate(-x, -y);
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
 * 領域ローカル座標（左上原点・回転込み）で描画コールバックを実行する
 */
function withStampRegionTransform(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  rotationDeg: number,
  draw: () => void
): void {
  const rad = (rotationDeg * Math.PI) / 180;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(rad);
  draw();
  ctx.restore();
}

/**
 * エディタの現在状態を PNG Blob URL としてエクスポートする
 *
 * 座標はすべて元画像ピクセル空間で管理され、
 * Canvas の最大辺が MAX_CANVAS_DIMENSION を超える場合はスケールダウンする。
 *
 * @param imageElement - 元画像の HTMLImageElement
 * @param stampRegions - マスキング領域の配列
 * @param paintStrokes - ペイントストロークの配列
 * @param stampImages - ファイル名をキーにした画像マップ（stamp-face 用）
 * @returns PNG の Blob URL
 */
export async function exportEditorCanvas(
  imageElement: HTMLImageElement,
  stampRegions: StampRegion[],
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

  /** 有効なマスキング領域を種別に応じて描画 */
  for (const region of stampRegions) {
    if (!region.isEnabled) continue;
    const sx = region.x * scaleX;
    const sy = region.y * scaleY;
    const sw = region.width * scaleX;
    const sh = region.height * scaleY;
    const rotationDeg = getStampRegionRotationDeg(region);

    switch (region.stampType) {
      case "fill-black":
        withStampRegionTransform(ctx, sx, sy, rotationDeg, () => {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, sw, sh);
        });
        break;

      case "mosaic":
        if (rotationDeg === 0) {
          applyMosaic(ctx, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh));
        } else {
          applyMosaicRotated(ctx, sx, sy, sw, sh, rotationDeg);
        }
        break;

      case "blur":
        applyBlur(ctx, imageElement, sx, sy, sw, sh, scaleX, scaleY, rotationDeg);
        break;

      case "stamp-face": {
        const stamp = pickExportStampImage(region, stampImages);
        if (stamp) {
          withStampRegionTransform(ctx, sx, sy, rotationDeg, () => {
            const centerX = sw / 2;
            const centerY = sh / 2;
            const stampSize = Math.max(sw, sh);
            ctx.drawImage(
              stamp,
              centerX - stampSize / 2,
              centerY - stampSize / 2,
              stampSize,
              stampSize
            );
          });
        } else {
          withStampRegionTransform(ctx, sx, sy, rotationDeg, () => {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(0, 0, sw, sh);
          });
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
