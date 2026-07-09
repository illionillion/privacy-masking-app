import { describe, expect, it } from "vitest";
import { extractMarkdownH2Headings } from "./extractMarkdownH2Headings";

describe("extractMarkdownH2Headings", () => {
  it("h2 見出しのテキストと id を返す", () => {
    const headings = extractMarkdownH2Headings(`導入文

## 投稿前チェックリスト

本文

## まとめ
`);

    expect(headings).toEqual([
      { text: "投稿前チェックリスト", id: "投稿前チェックリスト" },
      { text: "まとめ", id: "まとめ" },
    ]);
  });

  it("コードフェンス内の ## は無視する", () => {
    const headings = extractMarkdownH2Headings(`## 本番見出し

\`\`\`md
## 無視される見出し
\`\`\`

## もう一つの見出し
`);

    expect(headings.map((heading) => heading.text)).toEqual(["本番見出し", "もう一つの見出し"]);
  });

  it("h1 / h3 は含めない", () => {
    const headings = extractMarkdownH2Headings(`# タイトル

### 小見出し

## 対象
`);

    expect(headings).toEqual([{ text: "対象", id: "対象" }]);
  });

  it("先頭インデント付き h2 を抽出する", () => {
    const headings = extractMarkdownH2Headings(`   ## 先頭インデント

## 通常
`);

    expect(headings).toEqual([
      { text: "先頭インデント", id: "先頭インデント" },
      { text: "通常", id: "通常" },
    ]);
  });

  it("閉じ ## 付き h2 から見出しテキストだけを取り出す", () => {
    const headings = extractMarkdownH2Headings(`## 閉じ記法 ##

## 通常
`);

    expect(headings).toEqual([
      { text: "閉じ記法", id: "閉じ記法" },
      { text: "通常", id: "通常" },
    ]);
  });

  it("インデント4スペース以上の行は h2 として扱わない", () => {
    const headings = extractMarkdownH2Headings(`    ## コードブロック相当

## 対象
`);

    expect(headings).toEqual([{ text: "対象", id: "対象" }]);
  });
});
