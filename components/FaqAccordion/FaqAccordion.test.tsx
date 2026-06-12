import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FaqAccordion } from "./index";

describe("FaqAccordion", () => {
  const defaultProps = {
    intro: "FAQ の概要です。",
    items: [
      {
        id: "question-1",
        question: "質問1",
        answer: "回答1の本文です。",
      },
      {
        id: "question-2",
        question: "質問2",
        answer: "回答2の本文です。",
      },
    ],
    footer: "[トップページへ戻る](/)",
  };

  it("intro と質問一覧が表示される", () => {
    render(<FaqAccordion {...defaultProps} />);

    expect(screen.getByText("FAQ の概要です。")).toBeInTheDocument();
    expect(screen.getByText("質問1")).toBeInTheDocument();
    expect(screen.getByText("質問2")).toBeInTheDocument();
  });

  it("アコーディオンを開くと回答が表示される", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion {...defaultProps} />);

    expect(screen.queryByText("回答1の本文です。")).not.toBeVisible();

    await user.click(screen.getByText("質問1"));

    expect(screen.getByText("回答1の本文です。")).toBeVisible();
  });

  it("フッターリンクが表示される", () => {
    render(<FaqAccordion {...defaultProps} />);

    expect(screen.getByRole("link", { name: "トップページへ戻る" })).toHaveAttribute("href", "/");
  });
});
