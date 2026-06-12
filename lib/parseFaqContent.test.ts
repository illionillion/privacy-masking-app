import { describe, expect, it } from "vitest";
import { parseFaqContent } from "./parseFaqContent";

describe("parseFaqContent", () => {
  it("intro・Q&A・フッターを分割する", () => {
    const parsed = parseFaqContent(
      [
        "はじめに。",
        "",
        "## 質問1",
        "",
        "回答1",
        "",
        "## 質問2",
        "",
        "回答2",
        "",
        "[トップページへ戻る](/)",
      ].join("\n")
    );

    expect(parsed.intro).toBe("はじめに。");
    expect(parsed.footer).toBe("[トップページへ戻る](/)");
    expect(parsed.items).toEqual([
      { id: "質問1", question: "質問1", answer: "回答1" },
      { id: "質問2", question: "質問2", answer: "回答2" },
    ]);
  });
});
