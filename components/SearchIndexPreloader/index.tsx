"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSearchIndexStore } from "@/lib/searchIndexStore";
import { shouldShowSearchLink } from "@/lib/shouldShowSearchLink";

/**
 * 検索導線が有効なルートでのみ search-index.json をプリロードする。
 */
export function SearchIndexPreloader() {
  const pathname = usePathname();
  const preload = useSearchIndexStore((state) => state.preload);

  useEffect(() => {
    if (!shouldShowSearchLink(pathname)) {
      return;
    }

    preload();
  }, [pathname, preload]);

  return null;
}
