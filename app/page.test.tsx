import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

// Next.js の next/image をモック
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

describe("Home", () => {
  it("見出しが表示される", () => {
    render(<Home />);
    expect(screen.getByText("To get started, edit the page.tsx file.")).toBeInTheDocument();
  });

  it("Next.jsロゴが表示される", () => {
    render(<Home />);
    expect(screen.getByAltText("Next.js logo")).toBeInTheDocument();
  });
});
