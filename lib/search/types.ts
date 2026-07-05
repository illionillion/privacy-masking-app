/** 検索 index に含めるコンテンツ種別。 */
export type SearchContentType = "guide" | "update" | "faq";

/** サイト内検索用の1エントリ。 */
export type SearchIndexEntry = {
  id: string;
  type: SearchContentType;
  title: string;
  summary: string;
  tags: string[];
  url: string;
};
