import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Header } from "./index";

describe("Header", () => {
  it("アプリ名が表示される", () => {
    render(<Header />);
    expect(screen.getByText("Privacy Masking Tool")).toBeInTheDocument();
  });

  it("サブタイトルが表示される", () => {
    render(<Header />);
    expect(screen.getByText("画像内の顔・個人情報を安全にマスキング")).toBeInTheDocument();
  });

  it("header要素がレンダリングされる", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
