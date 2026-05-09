import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("404 ラベルと見出しが表示される", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "ページが見つかりません" })
    ).toBeInTheDocument();
  });

  it("説明文が表示される", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/お探しのページは移動または削除された可能性があります/)
    ).toBeInTheDocument();
  });

  it("トップへのリンクが / である", () => {
    render(<NotFound />);
    const topLink = screen.getByRole("link", { name: "トップに戻る" });
    expect(topLink).toHaveAttribute("href", "/");
  });

  it("サービス紹介へのリンクが /lp である", () => {
    render(<NotFound />);
    const lpLink = screen.getByRole("link", { name: "サービス紹介を見る" });
    expect(lpLink).toHaveAttribute("href", "/lp");
  });
});
