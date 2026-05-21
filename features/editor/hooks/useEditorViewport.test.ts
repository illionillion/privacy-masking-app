import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VIEW_ZOOM } from "../lib/viewZoom";
import { useEditorViewport } from "./useEditorViewport";

describe("useEditorViewport", () => {
  it("nudgeViewCenter で現在の scale と zoom に応じて表示中心を移動できる", () => {
    const { result } = renderHook(() => useEditorViewport(1000, 500, 1, 1));

    act(() => {
      result.current.zoomIn();
    });

    act(() => {
      result.current.nudgeViewCenter(1, 0);
    });

    expect(result.current.viewZoom).toBeCloseTo(1.1);
    expect(result.current.viewCenter.x).toBeCloseTo(500 + 24 / 1.1);
    expect(result.current.viewCenter.y).toBe(250);
  });

  it("resetViewport でズーム倍率と表示中心を初期状態へ戻す", () => {
    const { result } = renderHook(() => useEditorViewport(400, 200, 1, 1));

    act(() => {
      result.current.zoomIn();
      result.current.nudgeViewCenter(-1, 1);
    });

    act(() => {
      result.current.resetViewport();
    });

    expect(result.current.viewZoom).toBe(VIEW_ZOOM.default);
    expect(result.current.viewCenter).toEqual({ x: 200, y: 100 });
  });

  it("ズーム上下限で canZoomOut / canZoomIn が切り替わる", () => {
    const { result } = renderHook(() => useEditorViewport(400, 200, 1, 1));

    expect(result.current.canZoomOut).toBe(true);
    expect(result.current.canZoomIn).toBe(true);

    for (let i = 0; i < 25; i += 1) {
      act(() => {
        result.current.zoomIn();
      });
    }

    expect(result.current.viewZoom).toBe(VIEW_ZOOM.max);
    expect(result.current.canZoomOut).toBe(true);
    expect(result.current.canZoomIn).toBe(false);

    for (let i = 0; i < 30; i += 1) {
      act(() => {
        result.current.zoomOut();
      });
    }

    expect(result.current.viewZoom).toBe(VIEW_ZOOM.min);
    expect(result.current.canZoomOut).toBe(false);
    expect(result.current.canZoomIn).toBe(true);
  });

  it("zoomAt でポインタ下を保ったまま倍率が変わる", () => {
    const { result } = renderHook(() => useEditorViewport(200, 100, 1, 1));

    act(() => {
      result.current.zoomAt({ x: 100, y: 50 }, 200, 100, VIEW_ZOOM.step);
    });

    expect(result.current.viewZoom).toBeCloseTo(1.1);
    expect(result.current.viewCenter).toEqual({ x: 100, y: 50 });
  });
});
