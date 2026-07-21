import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadAllUpdatePosts, loadUpdatePost, loadUpdatePostSlugs } from "./loadUpdatePosts";
import { UpdatePostNotFoundError } from "./updatePostNotFoundError";

/**
 * 更新記事の並び（日付降順、同日は slug 降順）を比較する。
 */
function compareUpdatePostsByDateDesc(
  a: { date: string; slug: string },
  b: { date: string; slug: string }
): number {
  const dateCompare = b.date.localeCompare(a.date);
  if (dateCompare !== 0) {
    return dateCompare;
  }
  return b.slug.localeCompare(a.slug);
}

describe("loadUpdatePosts", () => {
  it("更新記事を日付降順（同日は slug 降順）で返す", () => {
    const posts = loadAllUpdatePosts();

    expect(posts.length).toBeGreaterThan(0);
    expect([...posts].sort(compareUpdatePostsByDateDesc)).toEqual(posts);

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
    expect(() => loadUpdatePost("../privacy")).toThrow(UpdatePostNotFoundError);
  });

  it("slug 一覧をディレクトリ走査だけで返す", () => {
    const slugs = loadUpdatePostSlugs();
    const posts = loadAllUpdatePosts();

    expect(slugs.length).toBe(posts.length);
    expect(slugs.every((slug) => posts.some((post) => post.slug === slug))).toBe(true);
  });
});
