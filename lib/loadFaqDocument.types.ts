/** FAQ ページの frontmatter から読み取るメタ情報。 */
export type FaqDocumentFrontmatter = {
  title: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  lastUpdated: string;
};

export type LoadedFaqDocument = FaqDocumentFrontmatter & {
  content: string;
};
