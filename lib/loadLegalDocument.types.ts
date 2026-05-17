/** 読み込み可能な法務ドキュメントの slug。 */
export type LegalDocumentSlug = "terms" | "privacy";

/** frontmatter から読み取る法務ページのメタ情報。 */
export type LegalDocumentFrontmatter = {
  title: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
};

export type LoadedLegalDocument = LegalDocumentFrontmatter & {
  content: string;
};
