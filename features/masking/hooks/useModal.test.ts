import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useModal } from "./useModal";

describe("useModal", () => {
  let hook: ReturnType<typeof renderHook<ReturnType<typeof useModal>, unknown>>;

  beforeEach(() => {
    hook = renderHook(() => useModal());
  });

  it("初期状態は isOpen=false、key=0", () => {
    expect(hook.result.current.isOpen).toBe(false);
    expect(hook.result.current.key).toBe(0);
  });

  it("open() を呼ぶと isOpen が true になり key が 1 増える", () => {
    act(() => {
      hook.result.current.open();
    });
    expect(hook.result.current.isOpen).toBe(true);
    expect(hook.result.current.key).toBe(1);
  });

  it("open() を2回呼ぶと key が 2 になる", () => {
    act(() => {
      hook.result.current.open();
    });
    act(() => {
      hook.result.current.open();
    });
    expect(hook.result.current.isOpen).toBe(true);
    expect(hook.result.current.key).toBe(2);
  });

  it("close() を呼ぶと isOpen が false になる", () => {
    act(() => {
      hook.result.current.open();
    });
    act(() => {
      hook.result.current.close();
    });
    expect(hook.result.current.isOpen).toBe(false);
  });

  it("close() 後に open() すると isOpen が true に戻り key がさらに増える", () => {
    act(() => {
      hook.result.current.open();
    });
    act(() => {
      hook.result.current.close();
    });
    act(() => {
      hook.result.current.open();
    });
    expect(hook.result.current.isOpen).toBe(true);
    expect(hook.result.current.key).toBe(2);
  });
});
