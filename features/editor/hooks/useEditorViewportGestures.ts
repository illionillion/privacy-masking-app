"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import type { EditorMode } from "../types";
import { wheelEventToZoomDelta } from "../lib/viewZoom";

/** 2 点間の距離（px） */
function touchDistance(t0: Touch, t1: Touch): number {
  const dx = t1.clientX - t0.clientX;
  const dy = t1.clientY - t0.clientY;
  return Math.hypot(dx, dy);
}

/** 2 点の中点（クライアント座標） */
function touchCenter(t0: Touch, t1: Touch): { x: number; y: number } {
  return {
    x: (t0.clientX + t1.clientX) / 2,
    y: (t0.clientY + t1.clientY) / 2,
  };
}

interface UseEditorViewportGesturesParams {
  /** ホイール・タッチを受け取るステージラッパー */
  stageContainerRef: RefObject<HTMLDivElement | null>;
  stageWidth: number;
  stageHeight: number;
  viewZoom: number;
  mode: EditorMode;
  canPan: boolean;
  zoomAt: (
    stagePos: { x: number; y: number },
    stageWidth: number,
    stageHeight: number,
    zoomDelta: number
  ) => void;
  setZoomAt: (
    stagePos: { x: number; y: number },
    stageWidth: number,
    stageHeight: number,
    absoluteZoom: number
  ) => void;
  panByStageDelta: (stageDelta: { x: number; y: number }) => void;
}

interface UseEditorViewportGesturesReturn {
  /** ピンチ／パン中は Konva のポインタハンドラを抑止する */
  isGestureCapturing: boolean;
  /** パンセッションが進行中か（state 更新前の同期判定用） */
  hasActivePanSession: () => boolean;
  /** Space 押下中（パン可能カーソル表示用） */
  isSpacePanMode: boolean;
  /** ステージラッパーに付与するキャプチャ用 props */
  stageContainerProps: {
    onMouseDownCapture: (e: ReactMouseEvent<HTMLDivElement>) => void;
  };
  /** Konva の pointerDown より先にパンを開始できる場合 true */
  tryConsumeStagePointerDown: (
    e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => boolean;
  tryConsumeStagePointerMove: (
    e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => boolean;
  tryConsumeStagePointerUp: () => boolean;
}

/**
 * EditorCanvas のホイールズーム・Space+パン・ピンチ・SP 1 本指パンを扱う
 */
export function useEditorViewportGestures({
  stageContainerRef,
  stageWidth,
  stageHeight,
  viewZoom,
  mode,
  canPan,
  zoomAt,
  setZoomAt,
  panByStageDelta,
}: UseEditorViewportGesturesParams): UseEditorViewportGesturesReturn {
  const [isGestureCapturing, setIsGestureCapturing] = useState(false);
  const [isSpacePanMode, setIsSpacePanMode] = useState(false);

  const viewZoomRef = useRef(viewZoom);
  useEffect(() => {
    viewZoomRef.current = viewZoom;
  }, [viewZoom]);

  const spacePressedRef = useRef(false);
  const panSessionRef = useRef<{
    lastClientX: number;
    lastClientY: number;
  } | null>(null);
  const pinchSessionRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    focalStagePos: { x: number; y: number };
  } | null>(null);
  const dragPanSessionRef = useRef<{
    lastClientX: number;
    lastClientY: number;
  } | null>(null);
  const hasActivePanSession = useCallback(
    () => panSessionRef.current !== null || dragPanSessionRef.current !== null,
    []
  );

  const clientToStagePos = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const el = stageContainerRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [stageContainerRef]
  );

  const endPanSession = useCallback(() => {
    panSessionRef.current = null;
    dragPanSessionRef.current = null;
    setIsGestureCapturing(false);
  }, []);

  const endPinchSession = useCallback(() => {
    pinchSessionRef.current = null;
    setIsGestureCapturing(false);
  }, []);

  /** Space キーでパンモード切替 */
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isEditableTarget(e.target)) return;
      e.preventDefault();
      spacePressedRef.current = true;
      setIsSpacePanMode(true);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spacePressedRef.current = false;
      setIsSpacePanMode(false);
      endPanSession();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [endPanSession]);

  /** Space + 左ドラッグ（PC） */
  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      const session = panSessionRef.current;
      if (!session) return;
      const dx = e.clientX - session.lastClientX;
      const dy = e.clientY - session.lastClientY;
      session.lastClientX = e.clientX;
      session.lastClientY = e.clientY;
      if (dx !== 0 || dy !== 0) {
        panByStageDelta({ x: dx, y: dy });
      }
    };

    const onMouseUp = () => {
      if (panSessionRef.current || dragPanSessionRef.current) {
        endPanSession();
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [panByStageDelta, endPanSession]);

  /** ホイールズーム・2 本指ピンチ */
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = wheelEventToZoomDelta(e.deltaY, e.deltaMode);
      if (zoomDelta === 0) return;

      const stagePos = clientToStagePos(e.clientX, e.clientY);
      if (!stagePos || stageWidth <= 0 || stageHeight <= 0) return;
      zoomAt(stagePos, stageWidth, stageHeight, zoomDelta);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length < 2) return;
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (!t0 || !t1) return;
      const center = touchCenter(t0, t1);
      const stagePos = clientToStagePos(center.x, center.y);
      if (!stagePos) return;
      e.preventDefault();
      pinchSessionRef.current = {
        initialDistance: touchDistance(t0, t1),
        initialZoom: viewZoomRef.current,
        focalStagePos: stagePos,
      };
      dragPanSessionRef.current = null;
      setIsGestureCapturing(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      const pinch = pinchSessionRef.current;
      if (pinch && e.touches.length >= 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        if (!t0 || !t1) return;
        e.preventDefault();
        const dist = touchDistance(t0, t1);
        if (pinch.initialDistance <= 0) return;
        const center = touchCenter(t0, t1);
        const stagePos = clientToStagePos(center.x, center.y) ?? pinch.focalStagePos;
        const ratio = dist / pinch.initialDistance;
        setZoomAt(stagePos, stageWidth, stageHeight, pinch.initialZoom * ratio);
        return;
      }

      const touchPan = dragPanSessionRef.current;
      if (touchPan && e.touches.length === 1) {
        const t = e.touches[0];
        if (!t) return;
        if (e.cancelable) e.preventDefault();
        const dx = t.clientX - touchPan.lastClientX;
        const dy = t.clientY - touchPan.lastClientY;
        touchPan.lastClientX = t.clientX;
        touchPan.lastClientY = t.clientY;
        if (dx !== 0 || dy !== 0) {
          panByStageDelta({ x: dx, y: dy });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        endPinchSession();
      }
      if (e.touches.length === 0) {
        endPanSession();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [
    stageContainerRef,
    stageWidth,
    stageHeight,
    clientToStagePos,
    zoomAt,
    setZoomAt,
    panByStageDelta,
    endPanSession,
    endPinchSession,
  ]);

  const stageContainerProps = {
    onMouseDownCapture: (e: ReactMouseEvent<HTMLDivElement>) => {
      if (
        !spacePressedRef.current ||
        !canPan ||
        mode !== "select" ||
        e.button !== 0 ||
        stageWidth <= 0
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      panSessionRef.current = {
        lastClientX: e.clientX,
        lastClientY: e.clientY,
      };
      setIsGestureCapturing(true);
    },
  };

  const startDragPan = useCallback((clientX: number, clientY: number) => {
    dragPanSessionRef.current = {
      lastClientX: clientX,
      lastClientY: clientY,
    };
    setIsGestureCapturing(true);
  }, []);

  const tryConsumeStagePointerDown = useCallback(
    (e: KonvaEventObject<globalThis.MouseEvent> | KonvaEventObject<TouchEvent>): boolean => {
      if (pinchSessionRef.current || panSessionRef.current || dragPanSessionRef.current) {
        return true;
      }

      if ("touches" in e.evt) {
        if (e.evt.touches.length >= 2) return true;
        if (mode !== "select" || !canPan) return false;
        const stage = e.target.getStage();
        if (!stage || e.target !== stage) return false;
        const touch = e.evt.touches[0];
        if (!touch) return false;
        startDragPan(touch.clientX, touch.clientY);
        if (e.evt.cancelable) e.evt.preventDefault();
        return true;
      }

      const mouseEvt = e.evt;
      if (mouseEvt.button !== 0 || mode !== "select" || !canPan) return false;

      if (spacePressedRef.current) {
        startDragPan(mouseEvt.clientX, mouseEvt.clientY);
        mouseEvt.preventDefault();
        return true;
      }

      const stage = e.target.getStage();
      if (!stage || e.target !== stage) return false;
      startDragPan(mouseEvt.clientX, mouseEvt.clientY);
      mouseEvt.preventDefault();
      return true;
    },
    [mode, canPan, startDragPan]
  );

  const tryConsumeStagePointerMove = useCallback(
    (e: KonvaEventObject<globalThis.MouseEvent> | KonvaEventObject<TouchEvent>): boolean => {
      const dragPan = dragPanSessionRef.current;
      if (!dragPan) return false;

      if ("touches" in e.evt) {
        const touch = e.evt.touches[0];
        if (!touch) return false;
        if (e.evt.cancelable) e.evt.preventDefault();
        const dx = touch.clientX - dragPan.lastClientX;
        const dy = touch.clientY - dragPan.lastClientY;
        dragPan.lastClientX = touch.clientX;
        dragPan.lastClientY = touch.clientY;
        if (dx !== 0 || dy !== 0) {
          panByStageDelta({ x: dx, y: dy });
        }
        return true;
      }

      const mouseEvt = e.evt;
      if (mouseEvt.buttons !== 1) return false;
      mouseEvt.preventDefault();
      const dx = mouseEvt.clientX - dragPan.lastClientX;
      const dy = mouseEvt.clientY - dragPan.lastClientY;
      dragPan.lastClientX = mouseEvt.clientX;
      dragPan.lastClientY = mouseEvt.clientY;
      if (dx !== 0 || dy !== 0) {
        panByStageDelta({ x: dx, y: dy });
      }
      return true;
    },
    [panByStageDelta]
  );

  const tryConsumeStagePointerUp = useCallback((): boolean => {
    if (dragPanSessionRef.current) {
      endPanSession();
      return true;
    }
    return false;
  }, [endPanSession]);

  return {
    isGestureCapturing,
    hasActivePanSession,
    isSpacePanMode,
    stageContainerProps,
    tryConsumeStagePointerDown,
    tryConsumeStagePointerMove,
    tryConsumeStagePointerUp,
  };
}
