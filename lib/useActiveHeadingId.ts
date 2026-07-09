"use client";

import { useEffect, useState } from "react";

const MAX_OBSERVER_SETUP_ATTEMPTS = 60;

/**
 * 画面内で最も上にある見出し id を IntersectionObserver で追跡する。
 *
 * Markdown 本文は Client Component のため、見出し DOM の出現を待ってから監視を始める。
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

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let attempts = 0;

    const setupObserver = (): void => {
      if (cancelled) {
        return;
      }

      const elements = ids
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null);

      if (elements.length === 0) {
        attempts += 1;
        if (attempts < MAX_OBSERVER_SETUP_ATTEMPTS) {
          requestAnimationFrame(setupObserver);
        }
        return;
      }

      const visibleIds = new Set<string>();

      observer = new IntersectionObserver(
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
    };

    setupObserver();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [headingIdsKey]);

  return activeId;
}
