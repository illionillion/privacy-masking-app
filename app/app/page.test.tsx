import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PRIMARY_MASKING_DEMO } from "@/lib/maskingDemoSamples";
import { APP_PAGE_ABOUT, APP_PAGE_HEADING, APP_PAGE_LEAD } from "@/lib/siteSeo";
import AppPage from "./page";

vi.mock("@/features/masking", () => ({
  MaskingGallery: () => <div data-testid="masking-gallery">MaskingGallery</div>,
}));

describe("AppPage", () => {
  it("ページタイトルが表示される", () => {
    render(<AppPage />);
    expect(screen.getByRole("heading", { level: 1, name: APP_PAGE_HEADING })).toBeInTheDocument();
  });

  it("説明テキストが表示される", () => {
    render(<AppPage />);
    expect(screen.getByText(APP_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByText(APP_PAGE_ABOUT)).toBeInTheDocument();
  });

  it("コンパクトデモとトップへのリンクが表示される", () => {
    render(<AppPage />);
    expect(screen.getByRole("heading", { level: 2, name: "使い例" })).toBeInTheDocument();
    expect(screen.getByAltText(PRIMARY_MASKING_DEMO.beforeAlt)).toBeInTheDocument();
    expect(screen.getByAltText(PRIMARY_MASKING_DEMO.afterAlt)).toBeInTheDocument();
    const moreLink = screen.getByRole("link", { name: "説明をもっと見る" });
    expect(moreLink).toHaveAttribute("href", "/");
  });

  it("MaskingGalleryコンポーネントが表示される", () => {
    render(<AppPage />);
    expect(screen.getByTestId("masking-gallery")).toBeInTheDocument();
  });
});
