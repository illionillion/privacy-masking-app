/**
 * 公開GitHubリポジトリのURL。
 *
 * スター導線やREADME等で参照する単一ソースとして定義する。
 */
export const GITHUB_REPOSITORY_URL = "https://github.com/illionillion/privacy-masking-app" as const;

/**
 * GitHub Issues のベースURL（不具合報告・機能要望等）。
 */
export const GITHUB_ISSUES_URL = `${GITHUB_REPOSITORY_URL}/issues` as const;

/**
 * GitHub Discussions のベースURL（質問・一般ディスカッション）。
 */
export const GITHUB_DISCUSSIONS_URL = `${GITHUB_REPOSITORY_URL}/discussions` as const;
