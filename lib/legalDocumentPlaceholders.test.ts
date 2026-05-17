import { describe, expect, it } from "vitest";
import { substituteLegalDocumentPlaceholders } from "./legalDocumentPlaceholders";
import { GITHUB_ISSUES_URL } from "./githubRepositoryUrl";

describe("substituteLegalDocumentPlaceholders", () => {
  it("既知のプレースホルダを URL に置換する", () => {
    const result = substituteLegalDocumentPlaceholders("[Issues]({{GITHUB_ISSUES_URL}})");

    expect(result).toBe(`[Issues](${GITHUB_ISSUES_URL})`);
  });

  it("未知のプレースホルダはそのまま残す", () => {
    const result = substituteLegalDocumentPlaceholders("{{UNKNOWN_KEY}}");

    expect(result).toBe("{{UNKNOWN_KEY}}");
  });
});
