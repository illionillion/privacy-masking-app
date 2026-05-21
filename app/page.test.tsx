import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PRIMARY_MASKING_DEMO } from "@/lib/maskingDemoSamples";
import { HOME_PAGE_ABOUT, HOME_PAGE_HEADING, HOME_PAGE_LEAD } from "@/lib/siteSeo";
import Home from "./page";

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
    expect(screen.getByText(HOME_PAGE_ABOUT)).toBeInTheDocument();
  });

  it("コンパクトデモと LP へのリンクが表示される", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 2, name: "使い例" })).toBeInTheDocument();
    expect(screen.getByAltText(PRIMARY_MASKING_DEMO.beforeAlt)).toBeInTheDocument();
    expect(screen.getByAltText(PRIMARY_MASKING_DEMO.afterAlt)).toBeInTheDocument();
    const moreLink = screen.getByRole("link", { name: "説明をもっと見る" });
    expect(moreLink).toHaveAttribute("href", "/lp");
  });

  it("MaskingGalleryコンポーネントが表示される", () => {
    render(<Home />);
    expect(screen.getByTestId("masking-gallery")).toBeInTheDocument();
  });
});
