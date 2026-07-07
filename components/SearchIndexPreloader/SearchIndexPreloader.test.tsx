import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetSearchIndexStore, useSearchIndexStore } from "@/lib/searchIndexStore";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/faq"),
}));

import { usePathname } from "next/navigation";
import { SearchIndexPreloader } from "./index";

describe("SearchIndexPreloader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSearchIndexStore();
  });

  it("検索導線が有効なルートでは preload を呼ぶ", () => {
    const preload = vi.fn();
    useSearchIndexStore.setState({ preload });
    vi.mocked(usePathname).mockReturnValue("/faq");

    render(<SearchIndexPreloader />);

    expect(preload).toHaveBeenCalledTimes(1);
  });

  it("/app では preload を呼ばない", () => {
    const preload = vi.fn();
    useSearchIndexStore.setState({ preload });
    vi.mocked(usePathname).mockReturnValue("/app");

    render(<SearchIndexPreloader />);

    expect(preload).not.toHaveBeenCalled();
  });
});
