/** ブログ記事 frontmatter の必須項目。 */
export type BlogPostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
};

/** ビルド時に読み込んだブログ記事。 */
export type LoadedBlogPost = BlogPostFrontmatter & {
  slug: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  content: string;
};
