import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuidePostList } from "./index";

describe("GuidePostList", () => {
  it("ガイド一覧を表示する", () => {
    render(
      <GuidePostList
        posts={[
          {
            title: "画像の読み込ませ方",
            summary: "画像を追加して編集を始める手順",
            order: 1,
            slug: "image-import",
            pageTitle: "画像の読み込ませ方 | 使い方ガイド | 伏せ太郎（Fusely）",
            description: "画像を追加して編集を始める手順",
            canonicalPath: "guides/image-import",
            content: "本文",
          },
        ]}
      />
    );

    expect(screen.getByText("ガイド 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "画像の読み込ませ方" })).toHaveAttribute(
      "href",
      "/guides/image-import"
    );
    expect(screen.getByText("画像を追加して編集を始める手順")).toBeInTheDocument();
  });

  it("ガイドがない場合の空状態を表示する", () => {
    render(<GuidePostList posts={[]} />);

    expect(screen.getByText("公開中のガイドはまだありません。")).toBeInTheDocument();
  });
});
