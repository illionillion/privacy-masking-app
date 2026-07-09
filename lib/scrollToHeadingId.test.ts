import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { navigateToHeadingId, scrollToHeadingId, setHeadingHash } from "./scrollToHeadingId";

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
  });

  it("要素が無いとき false を返す", () => {
    expect(scrollToHeadingId("missing")).toBe(false);
  });
});

describe("setHeadingHash", () => {
  beforeEach(() => {
    vi.stubGlobal("history", {
      replaceState: vi.fn(),
    });
    vi.stubGlobal("location", {
      hash: "",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ハッシュを更新する", () => {
    setHeadingHash("まとめ");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "#まとめ");
  });
});

describe("navigateToHeadingId", () => {
  beforeEach(() => {
    vi.stubGlobal("history", {
      replaceState: vi.fn(),
    });
    vi.stubGlobal("location", {
      hash: "",
    });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("要素が無くてもハッシュを先に更新する", () => {
    navigateToHeadingId("missing");
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "#missing");
  });

  it("要素があるときスクロールする", () => {
    const heading = document.createElement("h2");
    heading.id = "まとめ";
    heading.scrollIntoView = vi.fn();
    document.body.append(heading);

    navigateToHeadingId("まとめ");

    expect(heading.scrollIntoView).toHaveBeenCalled();
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "#まとめ");
  });
});
