"use client";

import { create } from "zustand";

/** 確認ダイアログの状態 */
interface ConfirmState {
  /** ダイアログが開いているか */
  isOpen: boolean;
  /** 表示するメッセージ */
  message: string;
  /** ユーザーの応答を受け取る resolve 関数 */
  resolve: ((value: boolean) => void) | null;
}

/** 確認ダイアログのアクション */
interface ConfirmActions {
  /**
   * 確認ダイアログを開き、ユーザーの応答を Promise で返す
   *
   * @param message - ダイアログに表示するメッセージ
   * @returns OK なら true、キャンセルなら false
   */
  open: (message: string) => Promise<boolean>;
  /**
   * 確認ダイアログを閉じ、ユーザーの応答を resolve する
   *
   * @param value - OK なら true、キャンセルなら false
   */
  close: (value: boolean) => void;
}

/** 確認ダイアログの zustand ストア */
export const useConfirmStore = create<ConfirmState & ConfirmActions>((set, get) => ({
  isOpen: false,
  message: "",
  resolve: null,

  open: (message: string): Promise<boolean> => {
    const { resolve: prevResolve, isOpen } = get();
    if (isOpen && prevResolve) {
      prevResolve(false);
    }
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, message, resolve });
    });
  },

  close: (value: boolean): void => {
    const { resolve } = get();
    resolve?.(value);
    set({ isOpen: false, message: "", resolve: null });
  },
}));
