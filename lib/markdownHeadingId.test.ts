import { describe, expect, it } from "vitest";
import { assignUniqueMarkdownHeadingId, markdownHeadingToId } from "./markdownHeadingId";

describe("assignUniqueMarkdownHeadingId", () => {
  it("初回は base id を返す", () => {
    const usedIds = new Set<string>();

    expect(assignUniqueMarkdownHeadingId("まとめ", usedIds)).toBe("まとめ");
    expect(usedIds).toEqual(new Set(["まとめ"]));
  });

  it("重複時は -2, -3 とサフィックスを付与する", () => {
    const usedIds = new Set<string>([markdownHeadingToId("まとめ")]);

    expect(assignUniqueMarkdownHeadingId("まとめ", usedIds)).toBe("まとめ-2");
    expect(assignUniqueMarkdownHeadingId("まとめ", usedIds)).toBe("まとめ-3");
  });
});
