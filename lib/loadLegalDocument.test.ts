import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadLegalDocument } from "./loadLegalDocument";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "./githubRepositoryUrl";

describe("loadLegalDocument", () => {
  it("terms の frontmatter とプレースホルダ置換を返す", () => {
    const doc = loadLegalDocument("terms");

    expect(doc.title).toBe("利用規約");
    expect(doc.pageTitle).toContain("利用規約");
    expect(doc.canonicalPath).toBe("terms");
    expect(doc.lastUpdated).toBe("2026年5月12日");
    expect(doc.content).toContain(GITHUB_ISSUES_URL);
    expect(doc.content).not.toContain("{{GITHUB_ISSUES_URL}}");
    expect(doc.content).toContain("[GitHub](" + GITHUB_REPOSITORY_URL + ")");
  });

  it("privacy の frontmatter を返す", () => {
    const doc = loadLegalDocument("privacy");

    expect(doc.title).toBe("プライバシーポリシー");
    expect(doc.canonicalPath).toBe("privacy");
    expect(doc.content).toContain(GITHUB_DISCUSSIONS_URL);
    expect(doc.content).toContain(GITHUB_REPOSITORY_URL);
  });
});
