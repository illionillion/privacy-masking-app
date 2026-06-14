import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadAllUpdatePosts, loadUpdatePost } from "./loadUpdatePosts";

describe("loadUpdatePosts", () => {
  it("更新記事を日付降順で返す", () => {
    const posts = loadAllUpdatePosts();

    expect(posts.length).toBeGreaterThanOrEqual(11);
    expect(posts[0]?.slug).toBe("2026-06-10-ocr-phone-detection");
    expect(posts[0]?.pageTitle).toContain("更新情報");
    expect(posts[0]?.canonicalPath).toBe("updates/2026-06-10-ocr-phone-detection");
  });

  it("slug から記事本文と summary を読み込む", () => {
    const post = loadUpdatePost("2026-05-24-editor-viewport-gestures");

    expect(post.title).toContain("ズーム");
    expect(post.summary.length).toBeGreaterThan(0);
    expect(post.content).toContain("Pull Request #72");
  });
});
