import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadFaqDocument } from "./loadFaqDocument";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "./githubRepositoryUrl";

describe("loadFaqDocument", () => {
  it("frontmatter とプレースホルダ置換を返す", () => {
    const doc = loadFaqDocument();

    expect(doc.title).toBe("よくある質問（FAQ）");
    expect(doc.pageTitle).toContain("FAQ");
    expect(doc.canonicalPath).toBe("faq");
    expect(doc.lastUpdated).toBe("2026年6月11日");
    expect(doc.content).toContain(GITHUB_ISSUES_URL);
    expect(doc.content).toContain(GITHUB_DISCUSSIONS_URL);
    expect(doc.content).toContain(GITHUB_REPOSITORY_URL);
    expect(doc.content).not.toContain("{{GITHUB_ISSUES_URL}}");
  });

  it("8 問以上・各回答 150 字以上の本文を返す", () => {
    const doc = loadFaqDocument();
    const sections = doc.content.split(/^## /m).slice(1);

    expect(sections.length).toBeGreaterThanOrEqual(8);

    for (const section of sections) {
      const body = section.replace(/^[^\n]+\n/, "").trim();
      expect(body.length).toBeGreaterThanOrEqual(150);
    }
  });
});
