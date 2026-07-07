"use client";

import type { ReactNode } from "react";
import { useSearchModalStore } from "@/lib/searchModalStore";

type SearchModalTriggerProps = {
  className: string;
  children: ReactNode;
};

/**
 * サイト内検索モーダルを開くトリガーボタン。
 */
export function SearchModalTrigger({ className, children }: SearchModalTriggerProps) {
  const open = useSearchModalStore((state) => state.open);

  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}
