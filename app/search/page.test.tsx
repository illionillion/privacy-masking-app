import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchPage from "./page";

describe("SearchPage", () => {
  it("サイト内検索ページを表示する", () => {
    render(<SearchPage />);

    expect(screen.getByRole("heading", { level: 1, name: "サイト内検索" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });
});
