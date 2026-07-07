import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { collectSearchIndexEntries } from "./collectSearchIndexEntries";

describe("collectSearchIndexEntries", () => {
  it("guides / updates / FAQ の検索 index を生成する", () => {
    const entries = collectSearchIndexEntries();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((entry) => entry.type === "guide")).toBe(true);
    expect(entries.some((entry) => entry.type === "update")).toBe(true);
    expect(entries.some((entry) => entry.type === "faq")).toBe(true);
  });

  it("各エントリに title / summary / tags / type / url を含める", () => {
    const entries = collectSearchIndexEntries();

    for (const entry of entries) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(Array.isArray(entry.tags)).toBe(true);
      expect(entry.url.startsWith("/")).toBe(true);
    }
  });

  it("FAQ は Q&A 単位でアンカー付き URL を持つ", () => {
    const entries = collectSearchIndexEntries().filter((entry) => entry.type === "faq");

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.url.startsWith("/faq#"))).toBe(true);
  });
});
