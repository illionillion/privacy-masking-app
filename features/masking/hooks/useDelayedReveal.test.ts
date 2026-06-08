import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDelayedReveal } from "./useDelayedReveal";

describe("useDelayedReveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ready が false のときは visible にならない", () => {
    const { result } = renderHook(() => useDelayedReveal(false, 200));
    expect(result.current).toBe(false);
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe(false);
  });

  it("ready が true になって delay 経過後に visible になる", () => {
    const { result, rerender } = renderHook(({ ready }) => useDelayedReveal(ready, 200), {
      initialProps: { ready: false },
    });

    rerender({ ready: true });
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe(true);
  });
});
