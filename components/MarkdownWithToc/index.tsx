"use client";

import clsx from "clsx";
import { useEffect, useMemo, type ReactNode } from "react";
import { TableOfContents } from "@/components/TableOfContents";
import type { MarkdownHeading } from "@/lib/extractMarkdownH2Headings";
import { scrollToHeadingId } from "@/lib/scrollToHeadingId";
import { useActiveHeadingId } from "@/lib/useActiveHeadingId";

type MarkdownWithTocProps = {
  /** 抽出済みの h2 見出し（1件以上あれば TOC を出す） */
  headings: MarkdownHeading[];
  /** ページ見出しブロック（タイトル・メタ情報など） */
  header: ReactNode;
  /** Markdown 本文など */
  children: ReactNode;
};

/**
 * 長文 Markdown 向けの TOC 付きレイアウト。
 *
 * PC（lg+）では右側に sticky TOC、SP では本文上に折りたたみ TOC を置く。
 * 現在位置ハイライト用の Observer は 1 箇所で共有する。
 */
export function MarkdownWithToc({ headings, header, children }: MarkdownWithTocProps) {
  const showToc = headings.length >= 1;
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const headingIdsKey = headingIds.join("\0");
  const activeId = useActiveHeadingId(showToc ? headingIds : []);

  useEffect(() => {
    if (!showToc || typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash.slice(1);
    if (hash.length === 0) {
      return;
    }

    const targetId = decodeURIComponent(hash);
    let attempts = 0;

    const scrollToHash = (): void => {
      if (scrollToHeadingId(targetId)) {
        return;
      }

      attempts += 1;
      if (attempts < 60) {
        requestAnimationFrame(scrollToHash);
      }
    };

    requestAnimationFrame(scrollToHash);
  }, [showToc, headingIdsKey]);

  return (
    <div className={clsx(["mx-auto w-full px-4 py-10", showToc ? "max-w-5xl" : "max-w-3xl"])}>
      <div
        className={
          showToc
            ? "lg:grid lg:grid-cols-[minmax(0,48rem)_11rem] lg:items-start lg:gap-8"
            : undefined
        }
      >
        <div className="min-w-0">
          {header}
          {showToc ? (
            <div className="mt-6 lg:hidden">
              <TableOfContents headings={headings} activeId={activeId} collapsible />
            </div>
          ) : null}
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700">{children}</div>
        </div>
        {showToc ? (
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <TableOfContents headings={headings} activeId={activeId} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
