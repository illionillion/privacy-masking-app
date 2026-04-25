import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

// MaskingGallery をモック
vi.mock("@/features/masking", () => ({
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
      screen.getByText(
        "画像をアップロードすると、顔・文字を検出してマスキングを編集し、ダウンロードできます"
      )
    ).toBeInTheDocument();
  });

  it("MaskingGalleryコンポーネントが表示される", () => {
    render(<Home />);
    expect(screen.getByTestId("masking-gallery")).toBeInTheDocument();
  });
});
