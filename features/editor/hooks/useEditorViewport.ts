"use client";

import { useCallback, useMemo, useState } from "react";
import {
  VIEW_CENTER_NUDGE_PX,
  VIEW_ZOOM,
  clampViewCenter,
  computeViewCenterAfterZoomAt,
  getDefaultViewCenter,
  panViewCenterByStageDelta,
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
  /** ステージ上の焦点を保ったまま表示倍率を増減する（ホイール・ピンチ用） */
  zoomAt: (
    stagePos: { x: number; y: number },
    stageWidth: number,
    stageHeight: number,
    zoomDelta: number
  ) => void;
  /** ステージ上の焦点を保ったまま表示倍率を絶対値で設定する（ピンチ用） */
  setZoomAt: (
    stagePos: { x: number; y: number },
    stageWidth: number,
    stageHeight: number,
    absoluteZoom: number
  ) => void;
  /** ステージ px のドラッグ量で表示中心を移動する */
  panByStageDelta: (stageDelta: { x: number; y: number }) => void;
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

  /**
   * ポインタ下の画像点を固定したまま表示倍率を変更する
   *
   * @param stagePos - ズームの焦点（ステージ座標）
   * @param stageWidth - ステージ幅
   * @param stageHeight - ステージ高さ
   * @param zoomDelta - 倍率の増減量
   */
  const zoomAt = useCallback(
    (
      stagePos: { x: number; y: number },
      stageWidth: number,
      stageHeight: number,
      zoomDelta: number
    ) => {
      if (zoomDelta === 0) return;
      setViewZoom((prevZoom) => {
        const nextZoom = roundViewZoomStep(prevZoom + zoomDelta);
        if (nextZoom === prevZoom) return prevZoom;
        setViewCenter((center) =>
          computeViewCenterAfterZoomAt(
            center,
            stagePos,
            stageWidth,
            stageHeight,
            scaleX,
            scaleY,
            prevZoom,
            nextZoom,
            imageNaturalWidth,
            imageNaturalHeight
          )
        );
        return nextZoom;
      });
    },
    [imageNaturalWidth, imageNaturalHeight, scaleX, scaleY]
  );

  /**
   * ポインタ下の画像点を固定したまま表示倍率を絶対値で設定する
   *
   * @param stagePos - ズームの焦点（ステージ座標）
   * @param stageWidth - ステージ幅
   * @param stageHeight - ステージ高さ
   * @param absoluteZoom - 目標倍率
   */
  const setZoomAt = useCallback(
    (
      stagePos: { x: number; y: number },
      stageWidth: number,
      stageHeight: number,
      absoluteZoom: number
    ) => {
      setViewZoom((prevZoom) => {
        const nextZoom = roundViewZoomStep(absoluteZoom);
        if (nextZoom === prevZoom) return prevZoom;
        setViewCenter((center) =>
          computeViewCenterAfterZoomAt(
            center,
            stagePos,
            stageWidth,
            stageHeight,
            scaleX,
            scaleY,
            prevZoom,
            nextZoom,
            imageNaturalWidth,
            imageNaturalHeight
          )
        );
        return nextZoom;
      });
    },
    [imageNaturalWidth, imageNaturalHeight, scaleX, scaleY]
  );

  /**
   * ステージ上のドラッグ量で表示中心を移動する（viewZoom > 1 のときのみ）
   *
   * @param stageDelta - ステージ px での移動量
   */
  const panByStageDelta = useCallback(
    (stageDelta: { x: number; y: number }) => {
      if (viewZoom <= 1) return;
      setViewCenter((center) =>
        panViewCenterByStageDelta(
          center,
          stageDelta,
          scaleX,
          scaleY,
          viewZoom,
          imageNaturalWidth,
          imageNaturalHeight
        )
      );
    },
    [imageNaturalWidth, imageNaturalHeight, scaleX, scaleY, viewZoom]
  );

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
    zoomAt,
    setZoomAt,
    panByStageDelta,
  };
}
