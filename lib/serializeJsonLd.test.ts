import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./serializeJsonLd";

describe("serializeJsonLd", () => {
  it("< と > を Unicode エスケープする", () => {
    const serialized = serializeJsonLd({ note: "</script><img>" });

    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<img>");
    expect(serialized).toContain("\\u003c/script\\u003e");

    expect(JSON.parse(serialized)).toEqual({ note: "</script><img>" });
  });
});
