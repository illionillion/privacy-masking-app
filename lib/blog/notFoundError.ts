/**
 * ブログ記事が存在しない（404 相当）ときに投げるエラー。
 */
export class BlogPostNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlogPostNotFoundError";
  }
}

/**
 * ブログ記事が存在しない（404 相当）エラーか判定する。
 */
export function isBlogPostNotFoundError(error: unknown): boolean {
  return error instanceof BlogPostNotFoundError;
}
