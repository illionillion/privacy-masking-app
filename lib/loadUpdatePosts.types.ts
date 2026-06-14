/** 更新記事 frontmatter の必須項目。 */
export type UpdatePostFrontmatter = {
  title: string;
  date: string;
  summary: string;
};

/** ビルド時に読み込んだ更新記事。 */
export type LoadedUpdatePost = UpdatePostFrontmatter & {
  slug: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  content: string;
};
