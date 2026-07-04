/** 使い方ガイド frontmatter の必須項目。 */
export type GuidePostFrontmatter = {
  title: string;
  summary: string;
  order: number;
};

/** ビルド時に読み込んだ使い方ガイド。 */
export type LoadedGuidePost = GuidePostFrontmatter & {
  slug: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  content: string;
};
