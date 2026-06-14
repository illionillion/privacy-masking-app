import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UpdatePostList } from "./index";

describe("UpdatePostList", () => {
  it("記事一覧を表示する", () => {
    render(
      <UpdatePostList
        posts={[
          {
            title: "テスト記事",
            date: "2026-06-13",
            summary: "概要テキスト",
            slug: "2026-06-13-test",
            pageTitle: "テスト記事 | 更新情報 | 伏せ太郎（Fusely）",
            description: "概要テキスト",
            canonicalPath: "updates/2026-06-13-test",
            content: "本文",
          },
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "テスト記事" })).toHaveAttribute(
      "href",
      "/updates/2026-06-13-test"
    );
    expect(screen.getByText("概要テキスト")).toBeInTheDocument();
    expect(screen.getByText("2026年6月13日")).toBeInTheDocument();
  });
});
