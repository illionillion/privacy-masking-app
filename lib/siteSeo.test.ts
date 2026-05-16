import { describe, expect, it } from "vitest";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_METADATA_KEYWORDS,
  SITE_TARGET_KEYWORD_PHRASES,
} from "./siteSeo";

describe("siteSeo", () => {
  it("狙うキーワードフレーズを keywords に含む", () => {
    for (const phrase of SITE_TARGET_KEYWORD_PHRASES) {
      expect(SITE_METADATA_KEYWORDS).toContain(phrase);
    }
  });

  it("description に主要検索意図の語を含む", () => {
    const description = SITE_DEFAULT_DESCRIPTION;
    expect(description).toMatch(/顔隠し/);
    expect(description).toMatch(/マスキング/);
    expect(description).toMatch(/スクショ|写真/);
    expect(description).toMatch(/AI/);
    expect(description).toMatch(/無料/);
    expect(description).toMatch(/ブラウザ/);
  });
});
