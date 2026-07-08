import { describe, expect, it } from "vitest";
import { isBlogPostNotFoundError, BlogPostNotFoundError } from "./notFoundError";

describe("isBlogPostNotFoundError", () => {
  it("BlogPostNotFoundError のとき true を返す", () => {
    expect(isBlogPostNotFoundError(new BlogPostNotFoundError("not found"))).toBe(true);
  });

  it("それ以外の Error のとき false を返す", () => {
    expect(isBlogPostNotFoundError(new Error("content/blog/x.md: missing frontmatter"))).toBe(
      false
    );
  });
});
