"use client";

import { useCallback, useState } from "react";

/** `useModal` が返す値の型 */
export interface Modal {
  /** モーダルが開いているか */
  isOpen: boolean;
  /** 再マウント用キー（開くたびにインクリメントされる） */
  key: number;
  /** モーダルを開く（key をインクリメントして再マウントさせる） */
  open: () => void;
  /** モーダルを閉じる */
  close: () => void;
}

/**
 * モーダルの開閉と再マウント用キーを管理するフック
 *
 * `open()` を呼ぶたびに key がインクリメントされるため、
 * モーダルを React の key として利用することで再オープン時にフォームがリセットされる。
 *
 * @returns `isOpen` / `key` / `open()` / `close()` を含むオブジェクト
 */
export function useModal(): Modal {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState(0);

  const open = useCallback(() => {
    setKey((prev) => prev + 1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, key, open, close };
}
