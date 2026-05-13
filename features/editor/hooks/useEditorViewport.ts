"use client";

import { useCallback, useMemo, useState } from "react";
import {
  VIEW_CENTER_NUDGE_PX,
  VIEW_ZOOM,
  clampViewCenter,
  getDefaultViewCenter,
  roundViewZoomStep,
  type ViewCenter,
} from "../lib/viewZoom";

/** 表示移動ボタン用の方向係数 */
export type ViewportDirection = -1 | 0 | 1;

/** `useEditorViewport` の戻り値 */
export interface UseEditorViewportReturn {
  viewZoom: number;
  viewCenter: ViewCenter;
  defaultViewCenter: ViewCenter;
  contentCenter: { x: number; y: number };
  canPan: boolean;
  canZoomOut: boolean;
  canZoomIn: boolean;
  nudgeViewCenter: (dxImageDir: ViewportDirection, dyImageDir: ViewportDirection) => void;
  resetViewCenter: () => void;
  zoomOut: () => void;
  resetViewport: () => void;
  zoomIn: () => void;
}

/**
 * EditorCanvas の表示ズームと表示中心を管理するフック
 *
 * 表示状態は stage px ではなく画像自然サイズ座標で保持し、
 * レイアウト変化があっても「どの画像領域を見ているか」がぶれにくいようにする。
 *
 * @param imageNaturalWidth - 元画像の幅
 * @param imageNaturalHeight - 元画像の高さ
 * @param scaleX - 画像座標から stage 座標への X スケール
 * @param scaleY - 画像座標から stage 座標への Y スケール
 * @returns 表示ズームの状態と操作関数
 */
export function useEditorViewport(
  imageNaturalWidth: number,
  imageNaturalHeight: number,
  scaleX: number,
  scaleY: number
): UseEditorViewportReturn {
  const [viewZoom, setViewZoom] = useState<number>(VIEW_ZOOM.default);
  const [viewCenter, setViewCenter] = useState<ViewCenter>(() =>
    getDefaultViewCenter(imageNaturalWidth, imageNaturalHeight)
  );

  const defaultViewCenter = useMemo(
    () => getDefaultViewCenter(imageNaturalWidth, imageNaturalHeight),
    [imageNaturalWidth, imageNaturalHeight]
  );

  const contentCenter = useMemo(
    () => ({
      x: viewCenter.x * scaleX,
      y: viewCenter.y * scaleY,
    }),
    [viewCenter, scaleX, scaleY]
  );

  const canPan = viewZoom > 1;
  const canZoomOut = viewZoom > VIEW_ZOOM.min;
  const canZoomIn = viewZoom < VIEW_ZOOM.max;

  /**
   * ボタン操作で表示中心を移動する
   *
   * ボタンの移動量は見た目上の一貫性を保つため stage px で定義し、
   * 現在のフィット倍率と表示ズーム倍率から画像座標へ換算して加算する。
   *
   * @param dxImageDir - X 方向の移動係数（左:-1 / 右:+1）
   * @param dyImageDir - Y 方向の移動係数（上:-1 / 下:+1）
   */
  const nudgeViewCenter = useCallback(
    (dxImageDir: ViewportDirection, dyImageDir: ViewportDirection) => {
      const deltaX = scaleX > 0 ? VIEW_CENTER_NUDGE_PX / (scaleX * viewZoom) : 0;
      const deltaY = scaleY > 0 ? VIEW_CENTER_NUDGE_PX / (scaleY * viewZoom) : 0;
      setViewCenter((center) =>
        clampViewCenter(
          {
            x: center.x + deltaX * dxImageDir,
            y: center.y + deltaY * dyImageDir,
          },
          imageNaturalWidth,
          imageNaturalHeight,
          viewZoom
        )
      );
    },
    [imageNaturalWidth, imageNaturalHeight, scaleX, scaleY, viewZoom]
  );

  /** 表示中心だけを画像中央へ戻す */
  const resetViewCenter = useCallback(() => {
    setViewCenter(defaultViewCenter);
  }, [defaultViewCenter]);

  /**
   * 表示ズームを 1 ステップ変更する
   *
   * @param direction - -1 で縮小、1 で拡大
   */
  const stepZoom = useCallback(
    (direction: -1 | 1) => {
      const nextZoom = roundViewZoomStep(viewZoom + VIEW_ZOOM.step * direction);
      setViewZoom(nextZoom);
      setViewCenter((center) =>
        clampViewCenter(center, imageNaturalWidth, imageNaturalHeight, nextZoom)
      );
    },
    [imageNaturalWidth, imageNaturalHeight, viewZoom]
  );

  /** 表示ズームを 1 段階縮小する */
  const zoomOut = useCallback(() => {
    stepZoom(-1);
  }, [stepZoom]);

  /** 表示ズームと表示中心を初期状態へ戻す */
  const resetViewport = useCallback(() => {
    setViewZoom(VIEW_ZOOM.default);
    setViewCenter(defaultViewCenter);
  }, [defaultViewCenter]);

  /** 表示ズームを 1 段階拡大する */
  const zoomIn = useCallback(() => {
    stepZoom(1);
  }, [stepZoom]);

  return {
    viewZoom,
    viewCenter,
    defaultViewCenter,
    contentCenter,
    canPan,
    canZoomOut,
    canZoomIn,
    nudgeViewCenter,
    resetViewCenter,
    zoomOut,
    resetViewport,
    zoomIn,
  };
}
