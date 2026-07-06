"use client";

import { create } from "zustand";
import { buildPublicAssetPath } from "@/lib/buildPublicAssetPath";
import type { SearchIndexEntry } from "@/lib/search/types";

const SEARCH_INDEX_URL = buildPublicAssetPath("search-index.json");

const LOAD_ERROR_MESSAGE = "検索データの読み込みに失敗しました。時間をおいて再度お試しください。";

/** 検索 index の読み込み状態 */
type SearchIndexState = {
  entries: SearchIndexEntry[];
  isLoading: boolean;
  loadError: string | null;
};

/** 検索 index の読み込みアクション */
type SearchIndexActions = {
  /** 検索 index の取得を開始する（取得済み・取得中は無視、失敗時は再試行可） */
  preload: () => void;
};

/** 検索 index をキャッシュする zustand ストア */
export const useSearchIndexStore = create<SearchIndexState & SearchIndexActions>((set, get) => ({
  entries: [],
  isLoading: false,
  loadError: null,
  preload: () => {
    if (get().isLoading || get().entries.length > 0) {
      return;
    }

    set({ isLoading: true, loadError: null });

    void (async () => {
      try {
        const response = await fetch(SEARCH_INDEX_URL);
        if (!response.ok) {
          throw new Error(`Failed to load search index: ${response.status}`);
        }

        const data = (await response.json()) as SearchIndexEntry[];
        set({ entries: data, loadError: null, isLoading: false });
      } catch {
        set({ loadError: LOAD_ERROR_MESSAGE, isLoading: false });
      }
    })();
  },
}));

/** テスト用にストアを初期状態へ戻す */
export function resetSearchIndexStore(): void {
  useSearchIndexStore.setState({
    entries: [],
    isLoading: false,
    loadError: null,
  });
}
