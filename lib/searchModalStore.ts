"use client";

import { create } from "zustand";

/** サイト内検索モーダルの状態 */
type SearchModalState = {
  isOpen: boolean;
};

/** サイト内検索モーダルのアクション */
type SearchModalActions = {
  /** 検索モーダルを開く */
  open: () => void;
  /** 検索モーダルを閉じる */
  close: () => void;
};

/** サイト内検索モーダルの zustand ストア */
export const useSearchModalStore = create<SearchModalState & SearchModalActions>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
