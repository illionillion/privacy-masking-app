import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_PAGE_HEADING, APP_PAGE_LEAD } from "@/lib/siteSeo";
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
  });

  it("MaskingGalleryコンポーネントが表示される", () => {
    render(<AppPage />);
    expect(screen.getByTestId("masking-gallery")).toBeInTheDocument();
  });
});
