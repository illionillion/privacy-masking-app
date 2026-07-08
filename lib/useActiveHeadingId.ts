"use client";

import { useEffect, useState } from "react";

/**
 * 画面内で最も上にある見出し id を IntersectionObserver で追跡する。
 *
 * sticky Header 分のオフセットを rootMargin で考慮する。
 * 見出し一覧が変わった直後は先頭を仮の現在位置とし、Observer のコールバックで更新する。
 */
export function useActiveHeadingId(headingIds: string[]): string | null {
  const headingIdsKey = headingIds.join("\0");
  const fallbackId = headingIds[0] ?? null;
  const [observed, setObserved] = useState<{ key: string; id: string } | null>(null);

  const activeId =
    observed !== null && observed.key === headingIdsKey && headingIds.includes(observed.id)
      ? observed.id
      : fallbackId;

  useEffect(() => {
    const ids = headingIdsKey.length > 0 ? headingIdsKey.split("\0") : [];

    if (ids.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const visibleIds = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement) || !entry.target.id) {
            continue;
          }
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }

        const nextActive = ids.find((id) => visibleIds.has(id));
        if (nextActive) {
          setObserved({ key: headingIdsKey, id: nextActive });
        }
      },
      {
        rootMargin: "-80px 0px -55% 0px",
        threshold: [0, 1],
      }
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [headingIdsKey]);

  return activeId;
}
