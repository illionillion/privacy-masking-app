import { describe, expect, it } from "vitest";
import { normalizeSearchTags } from "./normalizeSearchTags";

describe("normalizeSearchTags", () => {
  it("文字列配列をトリムして返す", () => {
    expect(normalizeSearchTags([" 設定 ", "OCR", ""])).toEqual(["設定", "OCR"]);
  });

  it("不正な値は空配列を返す", () => {
    expect(normalizeSearchTags(undefined)).toEqual([]);
    expect(normalizeSearchTags("設定")).toEqual([]);
  });
});
