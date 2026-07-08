import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadAllBlogPosts, loadBlogPost, loadBlogPostSlugs } from "./loadBlogPosts";
import { BlogPostNotFoundError } from "./notFoundError";

describe("loadBlogPosts", () => {
  it("ブログ記事を日付降順（同日は slug 降順）で返す", () => {
    const posts = loadAllBlogPosts();

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

    expect(posts.every((post) => post.pageTitle.includes("ブログ"))).toBe(true);
    expect(posts.every((post) => post.canonicalPath.startsWith("blog/"))).toBe(true);
    expect(posts.every((post) => post.category.length > 0)).toBe(true);
    expect(posts.every((post) => post.tags.length > 0)).toBe(true);
  });

  it("slug から記事本文と summary を読み込む", () => {
    const post = loadBlogPost("2026-07-08-event-photo-face-masking");

    expect(post.title).toContain("イベント写真");
    expect(post.summary.length).toBeGreaterThan(0);
    expect(post.content).toContain("投稿前チェックリスト");
    expect(post.category).toBe("プライバシー");
    expect(post.tags).toContain("SNS");
  });

  it("不正な slug を拒否する", () => {
    expect(() => loadBlogPost("../privacy")).toThrow(BlogPostNotFoundError);
  });

  it("slug 一覧をディレクトリ走査だけで返す", () => {
    const slugs = loadBlogPostSlugs();
    const posts = loadAllBlogPosts();

    expect(slugs.length).toBe(posts.length);
    expect(slugs.every((slug) => posts.some((post) => post.slug === slug))).toBe(true);
  });
});
