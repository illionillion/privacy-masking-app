"use client";

import { usePathname } from "next/navigation";
import { SearchModalTrigger } from "@/components/SearchModalTrigger";
import { shouldShowSearchLink } from "@/lib/shouldShowSearchLink";

type SiteFooterSearchTriggerProps = {
  className: string;
};

/**
 * フッターのサイト内検索トリガー。`/app` では非表示。
 */
export function SiteFooterSearchTrigger({ className }: SiteFooterSearchTriggerProps) {
  const pathname = usePathname();

  if (!shouldShowSearchLink(pathname)) {
    return null;
  }

  return <SearchModalTrigger className={className}>サイト内検索</SearchModalTrigger>;
}
