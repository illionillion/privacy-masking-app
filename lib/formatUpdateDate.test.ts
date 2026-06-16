import { describe, expect, it } from "vitest";
import { formatUpdateDate, isValidUpdateIsoDate } from "./formatUpdateDate";

describe("formatUpdateDate", () => {
  it("ISO 日付を日本語表示に変換する", () => {
    expect(formatUpdateDate("2026-06-13")).toBe("2026年6月13日");
  });
});

describe("isValidUpdateIsoDate", () => {
  it("有効な YYYY-MM-DD を true とする", () => {
    expect(isValidUpdateIsoDate("2026-06-13")).toBe(true);
  });

  it("不正な形式を false とする", () => {
    expect(isValidUpdateIsoDate("2026/06/13")).toBe(false);
    expect(isValidUpdateIsoDate("2026-13-01")).toBe(false);
  });
});
