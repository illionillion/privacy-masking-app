/**
 * 使い方ガイドが存在しない（404 相当）ときに投げるエラー。
 */
export class GuidePostNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuidePostNotFoundError";
  }
}

/**
 * 使い方ガイドが存在しない（404 相当）エラーか判定する。
 */
export function isGuidePostNotFoundError(error: unknown): boolean {
  return error instanceof GuidePostNotFoundError;
}
