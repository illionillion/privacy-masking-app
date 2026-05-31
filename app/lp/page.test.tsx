import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LpLegacyPage from "./page";

describe("LpLegacyPage", () => {
  it("トップへの案内リンクが表示される", () => {
    render(<LpLegacyPage />);
    const link = screen.getByRole("link", { name: "トップへ" });
    expect(link).toHaveAttribute("href", "/");
  });
});
