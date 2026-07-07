import { describe, expect, it } from "vitest";
import { searchIndexEntries } from "./searchContent";
import type { SearchIndexEntry } from "./types";

const SAMPLE_ENTRIES: SearchIndexEntry[] = [
  {
    id: "guide:settings",
    type: "guide",
    title: "設定を変える方法",
    summary: "検出やマスキングの設定を変更します。",
    tags: ["設定", "OCR"],
    url: "/guides/settings",
  },
  {
    id: "update:ocr",
    type: "update",
    title: "OCR の電話番号検出を改善",
    summary: "電話番号の取りこぼしを減らしました。",
    tags: ["OCR"],
    url: "/updates/2026-06-10-ocr-phone-detection",
  },
  {
    id: "faq:privacy",
    type: "faq",
    title: "画像はサーバーに送信されますか？",
    summary: "送信されません。ブラウザ内で完結します。",
    tags: ["FAQ"],
    url: "/faq#画像はサーバーに送信されますか",
  },
];

describe("searchIndexEntries", () => {
  it("空クエリでは全件を返す", () => {
    expect(searchIndexEntries(SAMPLE_ENTRIES, "")).toHaveLength(SAMPLE_ENTRIES.length);
    expect(searchIndexEntries(SAMPLE_ENTRIES, "   ")).toHaveLength(SAMPLE_ENTRIES.length);
  });

  it("タイトルやタグで絞り込める", () => {
    const results = searchIndexEntries(SAMPLE_ENTRIES, "設定");

    expect(results.map((entry) => entry.id)).toContain("guide:settings");
    expect(results.map((entry) => entry.id)).not.toContain("update:ocr");
  });

  it("summary でもヒットする", () => {
    const results = searchIndexEntries(SAMPLE_ENTRIES, "取りこぼし");

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("update:ocr");
  });
});
