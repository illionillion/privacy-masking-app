/** プロトタイプ汚染対策でマージから除外するキー */
const UNSAFE_MERGE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * プレーンオブジェクトを再帰的にマージする（配列は上書き、null はスキップ）
 *
 * @param base - ベースオブジェクト
 * @param override - 上書きする部分オブジェクト
 */
export function deepMergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    if (UNSAFE_MERGE_KEYS.has(key) || overrideValue === undefined || overrideValue === null) {
      continue;
    }
    const baseValue = result[key];
    if (isPlainRecord(baseValue) && isPlainRecord(overrideValue)) {
      result[key] = deepMergeRecords(baseValue, overrideValue);
      continue;
    }
    result[key] = overrideValue;
  }

  return result;
}

/**
 * @param value - プレーンオブジェクトかどうか
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
