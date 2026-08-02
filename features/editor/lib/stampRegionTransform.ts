import type { StampRegion } from "../types";

/** Transformer 後に許容する最小サイズ（元画像ピクセル空間） */
export const MIN_STAMP_REGION_SIZE = 1;

/**
 * Transformer 終了時の Konva ノード状態から、AABB を焼かずに領域更新値を求める
 *
 * 回転は角度として保持し、width/height はノードの scale を既存サイズへ乗算した実サイズとする。
 * 位置は Group の top-left（Konva デフォルトの回転原点）を画像空間へ変換する。
 *
 * @param region - 変形前の領域（width/height 参照用）
 * @param node - scale / rotation / x / y を持つ Konva ノード状態
 * @param stageScaleX - ステージの X スケール（画像→表示）
 * @param stageScaleY - ステージの Y スケール（画像→表示）
 */
export function stampRegionUpdatesFromTransformEnd(
  region: Pick<StampRegion, "width" | "height">,
  node: { x: number; y: number; scaleX: number; scaleY: number; rotation: number },
  stageScaleX: number,
  stageScaleY: number
): Pick<StampRegion, "x" | "y" | "width" | "height" | "rotation"> {
  const width = Math.max(MIN_STAMP_REGION_SIZE, region.width * Math.abs(node.scaleX));
  const height = Math.max(MIN_STAMP_REGION_SIZE, region.height * Math.abs(node.scaleY));
  return {
    x: node.x / stageScaleX,
    y: node.y / stageScaleY,
    width,
    height,
    rotation: node.rotation,
  };
}

/**
 * 領域の回転角（度）。未設定は 0。
 *
 * @param region - スタンプ領域
 */
export function getStampRegionRotationDeg(region: Pick<StampRegion, "rotation">): number {
  return region.rotation ?? 0;
}
