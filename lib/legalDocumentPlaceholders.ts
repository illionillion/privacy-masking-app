import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_REPOSITORY_URL,
} from "@/lib/githubRepositoryUrl";

/** 法務 MD 内の `{{NAME}}` プレースホルダと置換値の対応表。 */
export const LEGAL_DOCUMENT_PLACEHOLDERS: Record<string, string> = {
  GITHUB_REPOSITORY_URL,
  GITHUB_ISSUES_URL,
  GITHUB_DISCUSSIONS_URL,
};

/**
 * 法務 Markdown 本文内のプレースホルダを実 URL に置換する。
 */
export function substituteLegalDocumentPlaceholders(content: string): string {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) => {
    const value = LEGAL_DOCUMENT_PLACEHOLDERS[key];
    return value ?? match;
  });
}
