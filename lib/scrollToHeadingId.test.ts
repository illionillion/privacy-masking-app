import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrollToHeadingId } from "./scrollToHeadingId";

describe("scrollToHeadingId", () => {
  beforeEach(() => {
    vi.stubGlobal("history", {
      replaceState: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("見出し要素へ scrollIntoView する", () => {
    const heading = document.createElement("h2");
    heading.id = "投稿前チェックリスト";
    heading.scrollIntoView = vi.fn();
    document.body.append(heading);

    expect(scrollToHeadingId("投稿前チェックリスト")).toBe(true);
    expect(heading.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "#投稿前チェックリスト");
  });

  it("要素が無いとき false を返す", () => {
    expect(scrollToHeadingId("missing")).toBe(false);
  });
});
