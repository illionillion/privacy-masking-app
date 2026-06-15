/**
 * 更新記事が存在しない（404 相当）ときに投げるエラー。
 */
export class UpdatePostNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpdatePostNotFoundError";
  }
}

/**
 * 更新記事が存在しない（404 相当）エラーか判定する。
 */
export function isUpdatePostNotFoundError(error: unknown): boolean {
  return error instanceof UpdatePostNotFoundError;
}
