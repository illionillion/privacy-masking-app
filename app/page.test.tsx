import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

// MaskingEditor をモック
vi.mock("@/features/editor", () => ({
  MaskingEditor: () => <div data-testid="masking-editor">MaskingEditor</div>,
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

  it("MaskingEditorコンポーネントが表示される", () => {
    render(<Home />);
    expect(screen.getByTestId("masking-editor")).toBeInTheDocument();
  });
});
