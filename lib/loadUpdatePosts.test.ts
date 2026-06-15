import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isUpdatePostNotFoundError,
  loadAllUpdatePosts,
  loadUpdatePost,
  loadUpdatePostSlugs,
} from "./loadUpdatePosts";

describe("loadUpdatePosts", () => {
  it("更新記事を日付降順（同日は slug 降順）で返す", () => {
    const posts = loadAllUpdatePosts();

    expect(posts.length).toBeGreaterThan(0);

    for (let index = 1; index < posts.length; index += 1) {
      const previous = posts[index - 1]!;
      const current = posts[index]!;
      const dateCompare = previous.date.localeCompare(current.date);

      expect(dateCompare).toBeGreaterThanOrEqual(0);
      if (dateCompare === 0) {
        expect(previous.slug.localeCompare(current.slug)).toBeGreaterThanOrEqual(0);
      }
    }

    expect(posts.every((post) => post.pageTitle.includes("更新情報"))).toBe(true);
    expect(posts.every((post) => post.canonicalPath.startsWith("updates/"))).toBe(true);
  });

  it("slug から記事本文と summary を読み込む", () => {
    const post = loadUpdatePost("2026-05-24-editor-viewport-gestures");

    expect(post.title).toContain("ズーム");
    expect(post.summary.length).toBeGreaterThan(0);
    expect(post.content).toContain("Pull Request #72");
  });

  it("不正な slug を拒否する", () => {
    expect(() => loadUpdatePost("../privacy")).toThrow(/invalid slug/);
  });

  it("slug 一覧をディレクトリ走査だけで返す", () => {
    const slugs = loadUpdatePostSlugs();
    const posts = loadAllUpdatePosts();

    expect(slugs.length).toBe(posts.length);
    expect(slugs.every((slug) => posts.some((post) => post.slug === slug))).toBe(true);
  });

  it("isUpdatePostNotFoundError が404相当のみ true を返す", () => {
    expect(isUpdatePostNotFoundError(new Error("content/updates/x.md: file not found"))).toBe(true);
    expect(isUpdatePostNotFoundError(new Error('content/updates/x.md: invalid slug "x"'))).toBe(
      true
    );
    expect(
      isUpdatePostNotFoundError(
        new Error("content/updates/x.md: missing or empty frontmatter: date")
      )
    ).toBe(false);
  });
});
