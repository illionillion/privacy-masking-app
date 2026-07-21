import { fireEvent, renderHook, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from "vitest";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import {
  useEditorViewportGestures,
  type UseEditorViewportGesturesParams,
} from "./useEditorViewportGestures";

type GesturesParams = UseEditorViewportGesturesParams & {
  zoomAt: Mock<UseEditorViewportGesturesParams["zoomAt"]>;
  setZoomAt: Mock<UseEditorViewportGesturesParams["setZoomAt"]>;
  panByStageDelta: Mock<UseEditorViewportGesturesParams["panByStageDelta"]>;
  onClearSelection: Mock<UseEditorViewportGesturesParams["onClearSelection"]>;
};

function mountGestures(overrides: Partial<GesturesParams> = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 400,
    height: 300,
    right: 400,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);

  const stageContainerRef: RefObject<HTMLDivElement | null> = { current: container };
  const zoomAt = vi.fn<UseEditorViewportGesturesParams["zoomAt"]>();
  const setZoomAt = vi.fn<UseEditorViewportGesturesParams["setZoomAt"]>();
  const panByStageDelta = vi.fn<UseEditorViewportGesturesParams["panByStageDelta"]>();
  const onClearSelection = vi.fn<UseEditorViewportGesturesParams["onClearSelection"]>();

  const props: GesturesParams = {
    stageContainerRef,
    stageWidth: 400,
    stageHeight: 300,
    viewZoom: 2,
    mode: "select",
    canPan: true,
    zoomAt,
    setZoomAt,
    panByStageDelta,
    onClearSelection,
    ...overrides,
  };

  const hook = renderHook((p: GesturesParams) => useEditorViewportGestures(p), {
    initialProps: props,
  });

  return { hook, container, zoomAt, setZoomAt, panByStageDelta, onClearSelection };
}

describe("useEditorViewportGestures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("wheel で zoomAt が呼ばれる", async () => {
    const { container, zoomAt } = mountGestures();

    fireEvent.wheel(container, { deltaY: -120, clientX: 200, clientY: 150 });

    await waitFor(() => {
      expect(zoomAt).toHaveBeenCalledWith(
        expect.objectContaining({ x: 200, y: 150 }),
        400,
        300,
        expect.any(Number)
      );
    });
  });

  it("2 本指タッチ開始で isGestureCapturing が true になる", async () => {
    const { hook, container } = mountGestures();

    fireEvent.touchStart(container, {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
    });

    await waitFor(() => {
      expect(hook.result.current.isGestureCapturing).toBe(true);
    });
  });

  it("Space+ドラッグで panByStageDelta が呼ばれる", async () => {
    const { hook, panByStageDelta } = mountGestures();

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true }));

    await waitFor(() => {
      expect(hook.result.current.isSpacePanMode).toBe(true);
    });

    hook.result.current.stageContainerProps.onMouseDownCapture({
      button: 0,
      clientX: 50,
      clientY: 50,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as ReactMouseEvent<HTMLDivElement>);

    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 70, clientY: 60, bubbles: true }));

    await waitFor(() => {
      expect(panByStageDelta).toHaveBeenCalledWith({ x: 20, y: 10 });
    });

    window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space", bubbles: true }));
  });

  it("INPUT フォーカス中は Space パンを開始しない", async () => {
    const user = userEvent.setup();
    const { hook } = mountGestures();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    await user.keyboard(" ");

    expect(hook.result.current.isSpacePanMode).toBe(false);
  });

  it("button フォーカス中は Space パンを開始しない", async () => {
    const user = userEvent.setup();
    const { hook } = mountGestures();
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();

    await user.keyboard(" ");

    expect(hook.result.current.isSpacePanMode).toBe(false);
  });

  it("canPan が false のとき Space パンを開始しない", () => {
    const { hook } = mountGestures({ canPan: false, viewZoom: 1 });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true }));

    expect(hook.result.current.isSpacePanMode).toBe(false);
  });

  it("選択モード以外では Space パンを開始しない", () => {
    const { hook } = mountGestures({ mode: "paint" });

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true }));

    expect(hook.result.current.isSpacePanMode).toBe(false);
  });

  it("空白ドラッグで panByStageDelta が呼ばれる", async () => {
    const { hook, panByStageDelta } = mountGestures();
    const stage = { getStage: () => stage, getType: () => "Stage" };
    const emptyEvent = {
      evt: { button: 0, clientX: 40, clientY: 40, preventDefault: vi.fn() },
      target: stage,
    } as unknown as Parameters<typeof hook.result.current.tryConsumeStagePointerDown>[0];

    expect(hook.result.current.tryConsumeStagePointerDown(emptyEvent)).toBe(true);

    const moveEvent = {
      evt: { buttons: 1, clientX: 60, clientY: 55, preventDefault: vi.fn() },
    } as unknown as Parameters<typeof hook.result.current.tryConsumeStagePointerMove>[0];

    expect(hook.result.current.tryConsumeStagePointerMove(moveEvent)).toBe(true);

    await waitFor(() => {
      expect(panByStageDelta).toHaveBeenCalledWith({ x: 20, y: 15 });
    });
  });

  it("pinViewportControls 時は修飾キーなし wheel で zoomAt しない", async () => {
    const { container, zoomAt } = mountGestures({ pinViewportControls: true });

    fireEvent.wheel(container, { deltaY: -120, clientX: 200, clientY: 150 });

    await waitFor(() => {
      expect(zoomAt).not.toHaveBeenCalled();
    });
  });

  it("pinViewportControls 時は Ctrl+wheel で zoomAt する", async () => {
    const { container, zoomAt } = mountGestures({ pinViewportControls: true });

    fireEvent.wheel(container, { deltaY: -120, clientX: 200, clientY: 150, ctrlKey: true });

    await waitFor(() => {
      expect(zoomAt).toHaveBeenCalled();
    });
  });

  it("Ctrl+wheel でも deltaY が 0 なら zoomAt しない", async () => {
    const { container, zoomAt } = mountGestures({ pinViewportControls: true });

    fireEvent.wheel(container, {
      deltaY: 0,
      deltaX: 50,
      clientX: 200,
      clientY: 150,
      ctrlKey: true,
    });

    await waitFor(() => {
      expect(zoomAt).not.toHaveBeenCalled();
    });
  });

  it("stageWidth が 0 のときは wheel で zoomAt しない", async () => {
    const { hook, container, zoomAt } = mountGestures({ stageWidth: 0 });

    fireEvent.wheel(container, { deltaY: -120, clientX: 200, clientY: 150 });

    await waitFor(() => {
      expect(zoomAt).not.toHaveBeenCalled();
    });

    hook.unmount();
  });

  it("Space+ドラッグ開始時は選択を解除しない", async () => {
    const { hook, onClearSelection } = mountGestures();

    window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", bubbles: true }));

    hook.result.current.stageContainerProps.onMouseDownCapture({
      button: 0,
      clientX: 50,
      clientY: 50,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as ReactMouseEvent<HTMLDivElement>);

    expect(onClearSelection).not.toHaveBeenCalled();
  });
});
