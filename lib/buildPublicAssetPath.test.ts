import { describe, expect, it } from "vitest";
import { buildPublicAssetPath } from "./buildPublicAssetPath";

describe("buildPublicAssetPath", () => {
  it("ベースパス未設定時はルート相対パスを返す", () => {
    expect(buildPublicAssetPath("search-index.json")).toBe("/search-index.json");
  });
});
