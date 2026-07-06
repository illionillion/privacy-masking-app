"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { searchIndexEntries } from "@/lib/search/searchContent";
import { useSearchIndexStore } from "@/lib/searchIndexStore";
import type { SearchContentType } from "@/lib/search/types";

const TYPE_LABELS: Record<SearchContentType, string> = {
  guide: "使い方ガイド",
  update: "更新情報",
  faq: "FAQ",
};

const SKELETON_COUNT = 4;

/** 読み込み中の候補カード用スケルトン */
function SearchResultSkeleton() {
  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-100" />
      <div className="mt-1 h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
    </li>
  );
}

type SiteSearchProps = {
  /** 検索結果を選んだときにモーダルを閉じるためのコールバック */
  onResultSelect?: () => void;
};

/**
 * サイト内検索 UI。index JSON を読み込み、クエリで絞り込む。
 */
export function SiteSearch({ onResultSelect }: SiteSearchProps) {
  const [query, setQuery] = useState("");
  const { entries, isLoading, loadError, preload } = useSearchIndexStore();

  useEffect(() => {
    preload();
  }, [preload]);

  const results = useMemo(() => searchIndexEntries(entries, query), [entries, query]);
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="sr-only">サイト内検索</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="キーワードで検索"
          className={clsx([
            "w-full",
            "rounded-lg",
            "border border-zinc-300",
            "bg-white",
            "px-4",
            "py-3",
            "text-sm",
            "text-zinc-900",
            "shadow-sm",
            "placeholder:text-zinc-400",
            "focus:border-indigo-500",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-indigo-500/20",
          ])}
        />
      </label>

      {isLoading ? (
        <div>
          <p className="text-sm text-zinc-500">候補を読み込んでいます…</p>
          <ul className="mt-4 space-y-3" aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <SearchResultSkeleton key={index} />
            ))}
          </ul>
        </div>
      ) : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      {!isLoading && !loadError ? (
        <div>
          <p className="text-sm text-zinc-500">
            {hasQuery ? `${results.length} 件の結果` : `${entries.length} 件の候補`}
          </p>
          <ul className="mt-4 space-y-3">
            {results.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-200"
              >
                <p className="text-xs font-semibold tracking-wide text-indigo-600">
                  {TYPE_LABELS[entry.type]}
                </p>
                <h2 className="mt-1 text-base font-semibold text-zinc-900">
                  <Link
                    href={entry.url}
                    onClick={onResultSelect}
                    className="underline-offset-2 hover:text-indigo-700 hover:underline"
                  >
                    {entry.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{entry.summary}</p>
                {entry.tags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <li
                        key={`${entry.id}:${tag}`}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
          {hasQuery && results.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">該当するページが見つかりませんでした。</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
