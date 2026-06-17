import type { CustomMaskTerm } from "./types";

/** 登録可能なマスク語句の最大件数 */
export const MAX_CUSTOM_MASK_TERMS = 50;

/** 1件あたりの最大文字数 */
export const MAX_CUSTOM_MASK_TERM_LENGTH = 100;

/**
 * 保存用にマスク語句一覧を正規化する（trim・空除去・重複排除・件数上限）
 *
 * @param terms - 編集後の語句一覧
 * @returns 保存可能な語句一覧
 */
export function sanitizeCustomMaskTermsForSave(terms: readonly CustomMaskTerm[]): CustomMaskTerm[] {
  const seen = new Set<string>();
  const result: CustomMaskTerm[] = [];

  for (const term of terms) {
    const text = term.text.trim().slice(0, MAX_CUSTOM_MASK_TERM_LENGTH);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    result.push({
      id: term.id,
      text,
      enabled: term.enabled,
    });
    if (result.length >= MAX_CUSTOM_MASK_TERMS) {
      break;
    }
  }

  return result;
}

/**
 * localStorage から読み込んだ値を CustomMaskTerm 配列に正規化する
 *
 * @param raw - 生の配列データ
 */
export function normalizeCustomMaskTerms(raw: unknown): CustomMaskTerm[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const result: CustomMaskTerm[] = [];

  for (const item of raw) {
    if (!isPlainRecord(item)) {
      continue;
    }

    const text =
      typeof item.text === "string" ? item.text.trim().slice(0, MAX_CUSTOM_MASK_TERM_LENGTH) : "";
    if (!text) {
      continue;
    }

    const id = typeof item.id === "string" && item.id.length > 0 ? item.id : createTermId();
    const enabled = typeof item.enabled === "boolean" ? item.enabled : true;

    result.push({ id, text, enabled });
    if (result.length >= MAX_CUSTOM_MASK_TERMS) {
      break;
    }
  }

  return result;
}

/**
 * 有効なマスク語句のテキスト一覧を返す
 *
 * @param terms - マスク語句一覧
 */
export function getEnabledCustomMaskTexts(terms: readonly CustomMaskTerm[]): string[] {
  return terms.filter((term) => term.enabled).map((term) => term.text);
}

/**
 * @param value - 検証対象
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 新規語句用の一意 ID を生成する */
export function createTermId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `term-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
