import { matchSorter } from "match-sorter";
import type { SearchIndexEntry } from "@/lib/search/types";

/**
 * 検索 index をクエリで絞り込み、関連度順に並べ替える。
 */
export function searchIndexEntries(entries: SearchIndexEntry[], query: string): SearchIndexEntry[] {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return entries;
  }

  return matchSorter(entries, trimmedQuery, {
    keys: [
      { key: "title", threshold: matchSorter.rankings.STARTS_WITH },
      { key: "tags", threshold: matchSorter.rankings.CONTAINS },
      { key: "summary", threshold: matchSorter.rankings.CONTAINS },
    ],
  });
}
