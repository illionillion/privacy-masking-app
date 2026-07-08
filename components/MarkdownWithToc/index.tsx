"use client";

import { useMemo, type ReactNode } from "react";
import { TableOfContents } from "@/components/TableOfContents";
import type { MarkdownHeading } from "@/lib/extractMarkdownH2Headings";
import { useActiveHeadingId } from "@/lib/useActiveHeadingId";

type MarkdownWithTocProps = {
  /** 抽出済みの h2 見出し（2件未満なら TOC は出さない） */
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
  const showToc = headings.length >= 2;
  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);
  const activeId = useActiveHeadingId(showToc ? headingIds : []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div
        className={
          showToc
            ? "lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start lg:gap-10"
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
