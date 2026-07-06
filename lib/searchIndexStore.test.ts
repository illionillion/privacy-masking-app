import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetSearchIndexStore, useSearchIndexStore } from "./searchIndexStore";
import type { SearchIndexEntry } from "./search/types";

const SAMPLE_INDEX: SearchIndexEntry[] = [
  {
    id: "guide:settings",
    type: "guide",
    title: "設定を変える方法",
    summary: "検出やマスキングの設定を変更します。",
    tags: ["設定"],
    url: "/guides/settings",
  },
];

describe("searchIndexStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    resetSearchIndexStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preload で index を取得してキャッシュする", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => SAMPLE_INDEX,
      })
    );

    useSearchIndexStore.getState().preload();

    await vi.waitFor(() => {
      expect(useSearchIndexStore.getState().isLoading).toBe(false);
    });

    expect(useSearchIndexStore.getState().entries).toEqual(SAMPLE_INDEX);
    expect(fetch).toHaveBeenCalledTimes(1);

    useSearchIndexStore.getState().preload();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("失敗後は preload で再試行できる", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => SAMPLE_INDEX,
      });
    vi.stubGlobal("fetch", fetchMock);

    useSearchIndexStore.getState().preload();
    await vi.waitFor(() => {
      expect(useSearchIndexStore.getState().loadError).not.toBeNull();
    });

    useSearchIndexStore.getState().preload();
    await vi.waitFor(() => {
      expect(useSearchIndexStore.getState().entries).toEqual(SAMPLE_INDEX);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
