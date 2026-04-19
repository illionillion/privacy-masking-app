import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

// MaskingGallery をモック
vi.mock("@/features/editor", () => ({
  MaskingGallery: () => <div data-testid="masking-gallery">MaskingGallery</div>,
}));

describe("Home", () => {
  it("ページタイトルが表示される", () => {
    render(<Home />);
    expect(screen.getByText("画像プライバシーマスキング")).toBeInTheDocument();
  });

  it("説明テキストが表示される", () => {
    render(<Home />);
    expect(
      screen.getByText("画像をアップロードすると、顔を自動で検出して矩形表示します")
    ).toBeInTheDocument();
  });

  it("MaskingGalleryコンポーネントが表示される", () => {
    render(<Home />);
    expect(screen.getByTestId("masking-gallery")).toBeInTheDocument();
  });
});
