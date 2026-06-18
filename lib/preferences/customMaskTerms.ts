import type { CustomMaskTerm } from "./types";

/** 登録可能なマスク語句の最大件数 */
export const MAX_CUSTOM_MASK_TERMS = 50;

/** 1件あたりの最大文字数 */
export const MAX_CUSTOM_MASK_TERM_LENGTH = 100;

/**
 * 重複判定用キー（trim + 空白除去。検出ロジックと揃える）
 *
 * @param text - 語句テキスト
 */
export function getCustomMaskTermDedupKey(text: string): string {
  return text.trim().slice(0, MAX_CUSTOM_MASK_TERM_LENGTH).replace(/\s+/gu, "");
}

/**
 * 保存用にマスク語句一覧を正規化する（trim・空除去・重複排除・件数上限）
 *
 * @param terms - 編集後の語句一覧
 * @returns 保存可能な語句一覧
 */
export function sanitizeCustomMaskTermsForSave(terms: readonly CustomMaskTerm[]): CustomMaskTerm[] {
  const seenTexts = new Set<string>();
  const seenIds = new Set<string>();
  const result: CustomMaskTerm[] = [];

  for (const term of terms) {
    const text = term.text.trim().slice(0, MAX_CUSTOM_MASK_TERM_LENGTH);
    const key = getCustomMaskTermDedupKey(text);
    if (!text || seenTexts.has(key)) {
      continue;
    }
    seenTexts.add(key);
    result.push({
      id: resolveUniqueTermId(term.id, seenIds),
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

  const seenTexts = new Set<string>();
  const seenIds = new Set<string>();
  const result: CustomMaskTerm[] = [];

  for (const item of raw) {
    if (!isPlainRecord(item)) {
      continue;
    }

    const text =
      typeof item.text === "string" ? item.text.trim().slice(0, MAX_CUSTOM_MASK_TERM_LENGTH) : "";
    const key = getCustomMaskTermDedupKey(text);
    if (!text || seenTexts.has(key)) {
      continue;
    }

    const enabled = typeof item.enabled === "boolean" ? item.enabled : true;

    seenTexts.add(key);
    result.push({
      id: resolveUniqueTermId(item.id, seenIds),
      text,
      enabled,
    });
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

/**
 * 語句 ID の一意性を保証する（空・重複時は新規採番）
 *
 * @param rawId - 入力 ID
 * @param seenIds - 既に使用済みの ID 集合（呼び出し側で更新される）
 */
function resolveUniqueTermId(rawId: unknown, seenIds: Set<string>): string {
  const candidate = typeof rawId === "string" && rawId.length > 0 ? rawId : null;
  if (candidate !== null && !seenIds.has(candidate)) {
    seenIds.add(candidate);
    return candidate;
  }

  let id = createTermId();
  while (seenIds.has(id)) {
    id = createTermId();
  }
  seenIds.add(id);
  return id;
}

/** 新規語句用の一意 ID を生成する */
export function createTermId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `term-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
