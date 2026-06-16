import { describe, expect, it } from "vitest";
import { isUpdatePostNotFoundError, UpdatePostNotFoundError } from "./updatePostNotFoundError";

describe("isUpdatePostNotFoundError", () => {
  it("UpdatePostNotFoundError のとき true を返す", () => {
    expect(isUpdatePostNotFoundError(new UpdatePostNotFoundError("not found"))).toBe(true);
  });

  it("それ以外の Error のとき false を返す", () => {
    expect(isUpdatePostNotFoundError(new Error("content/updates/x.md: missing frontmatter"))).toBe(
      false
    );
  });
});
