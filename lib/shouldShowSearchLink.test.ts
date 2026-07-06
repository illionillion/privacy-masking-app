import { describe, expect, it } from "vitest";
import { shouldShowSearchLink } from "./shouldShowSearchLink";

describe("shouldShowSearchLink", () => {
  it("/app では false を返す", () => {
    expect(shouldShowSearchLink("/app")).toBe(false);
  });

  it("/~offline では false を返す", () => {
    expect(shouldShowSearchLink("/~offline")).toBe(false);
  });

  it("その他のパスでは true を返す", () => {
    expect(shouldShowSearchLink("/faq")).toBe(true);
  });
});
