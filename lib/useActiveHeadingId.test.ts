import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveHeadingId } from "./useActiveHeadingId";

describe("useActiveHeadingId", () => {
  let observerCallback: IntersectionObserverCallback | undefined;
  let observe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observerCallback = undefined;
    observe = vi.fn();

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = observe;
        disconnect = vi.fn();

        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
      }
    );

    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("見出し DOM が遅れて出現しても監視を開始する", async () => {
    let rafCount = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      rafCount += 1;
      if (rafCount === 2) {
        const heading = document.createElement("h2");
        heading.id = "delayed";
        document.body.append(heading);
      }
      callback(0);
      return rafCount;
    });

    renderHook(() => useActiveHeadingId(["delayed"]));

    await waitFor(() => {
      expect(observe).toHaveBeenCalled();
    });
  });

  it("交差状態に応じて activeId を更新する", async () => {
    const first = document.createElement("h2");
    first.id = "first";
    const second = document.createElement("h2");
    second.id = "second";
    document.body.append(first, second);

    const { result } = renderHook(() => useActiveHeadingId(["first", "second"]));

    expect(result.current).toBe("first");

    observerCallback?.(
      [
        {
          target: second,
          isIntersecting: true,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    );

    await waitFor(() => {
      expect(result.current).toBe("second");
    });
  });
});
