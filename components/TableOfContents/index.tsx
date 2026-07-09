"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { MouseEvent } from "react";
import type { MarkdownHeading } from "@/lib/extractMarkdownH2Headings";
import { navigateToHeadingId } from "@/lib/scrollToHeadingId";

type TableOfContentsProps = {
  headings: MarkdownHeading[];
  activeId: string | null;
  /** SP 向けに details 折りたたみで表示する */
  collapsible?: boolean;
};

/**
 * Markdown の h2 目次リンク一覧。現在位置をハイライトする。
 */
export function TableOfContents({ headings, activeId, collapsible = false }: TableOfContentsProps) {
  if (headings.length === 0) {
    return null;
  }

  const linkList = <TocLinkList headings={headings} activeId={activeId} />;

  if (!collapsible) {
    return (
      <nav aria-label="目次" className="text-sm">
        <p className="text-xs font-semibold tracking-wide text-zinc-500">目次</p>
        <div className="mt-3">{linkList}</div>
      </nav>
    );
  }

  return (
    <nav aria-label="目次" className="text-sm">
      <details className="group rounded-xl border border-zinc-200 bg-white">
        <summary
          className={clsx([
            "flex",
            "cursor-pointer",
            "list-none",
            "items-center",
            "justify-between",
            "gap-2",
            "px-4",
            "py-3",
            "font-semibold",
            "text-zinc-900",
            "marker:content-none",
            "[&::-webkit-details-marker]:hidden",
          ])}
        >
          目次
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="border-t border-zinc-100 px-2 pb-3 pt-1">{linkList}</div>
      </details>
    </nav>
  );
}

type TocLinkListProps = {
  headings: MarkdownHeading[];
  activeId: string | null;
};

/**
 * TOC のリンク一覧を描画する。
 */
function TocLinkList({ headings, activeId }: TocLinkListProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string): void => {
    event.preventDefault();
    navigateToHeadingId(id);
  };

  return (
    <ol className="space-y-1">
      {headings.map((heading) => {
        const isActive = heading.id === activeId;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                handleClick(event, heading.id);
              }}
              className={clsx([
                "block",
                "rounded-md",
                "px-2",
                "py-1.5",
                "leading-snug",
                "transition-colors",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-indigo-500",
                isActive
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
              ])}
              aria-current={isActive ? "true" : undefined}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
