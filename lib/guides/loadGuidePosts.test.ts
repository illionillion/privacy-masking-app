import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertGuidePostFrontmatter, guideSlugFromFilename } from "@/lib/guides/frontmatter";
import { GuidePostNotFoundError } from "@/lib/guides/notFoundError";
import { loadAllGuidePosts, loadGuidePost, loadGuidePostSlugs } from "./loadGuidePosts";

/**
 * ガイド記事の並び（order 昇順、同じ order は slug 昇順）を比較する。
 */
function compareGuidePostsByOrderAsc(
  a: { order: number; slug: string },
  b: { order: number; slug: string }
): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  return a.slug.localeCompare(b.slug);
}

describe("loadGuidePosts", () => {
  it("使い方ガイドを order 昇順（同じ order は slug 昇順）で返す", () => {
    const posts = loadAllGuidePosts();

    expect([...posts].sort(compareGuidePostsByOrderAsc)).toEqual(posts);

    expect(posts.every((post) => post.pageTitle.includes("使い方ガイド"))).toBe(true);
    expect(posts.every((post) => post.canonicalPath.startsWith("guides/"))).toBe(true);
  });

  it("不正な slug を拒否する", () => {
    expect(() => loadGuidePost("../privacy")).toThrow(GuidePostNotFoundError);
  });

  it("slug 一覧をディレクトリ走査だけで返す", () => {
    const slugs = loadGuidePostSlugs();
    const posts = loadAllGuidePosts();

    expect(slugs.length).toBe(posts.length);
    expect(slugs.every((slug) => posts.some((post) => post.slug === slug))).toBe(true);
  });

  it("frontmatter の必須項目を検証する", () => {
    expect(
      assertGuidePostFrontmatter(
        {
          title: "画像の読み込ませ方",
          summary: "画像を追加して編集を始める手順",
          order: 1,
        },
        "image-import"
      )
    ).toEqual({
      title: "画像の読み込ませ方",
      summary: "画像を追加して編集を始める手順",
      order: 1,
    });
    expect(() =>
      assertGuidePostFrontmatter(
        {
          title: "画像の読み込ませ方",
          summary: "画像を追加して編集を始める手順",
          order: 0,
        },
        "image-import"
      )
    ).toThrow("order");
  });

  it("ファイル名から slug を取り出す", () => {
    expect(guideSlugFromFilename("manual-edit.md")).toBe("manual-edit");
    expect(() => guideSlugFromFilename("manual_edit.md")).toThrow(GuidePostNotFoundError);
  });
});
