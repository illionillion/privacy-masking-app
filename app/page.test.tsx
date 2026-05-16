import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HOME_PAGE_HEADING, HOME_PAGE_LEAD } from "@/lib/siteSeo";
import Home from "./page";

// MaskingGallery をモック
vi.mock("@/features/masking", () => ({
  MaskingGallery: () => <div data-testid="masking-gallery">MaskingGallery</div>,
}));

describe("Home", () => {
  it("ページタイトルが表示される", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: HOME_PAGE_HEADING })).toBeInTheDocument();
  });

  it("説明テキストが表示される", () => {
    render(<Home />);
    expect(screen.getByText(HOME_PAGE_LEAD)).toBeInTheDocument();
  });

  it("MaskingGalleryコンポーネントが表示される", () => {
    render(<Home />);
    expect(screen.getByTestId("masking-gallery")).toBeInTheDocument();
  });
});
