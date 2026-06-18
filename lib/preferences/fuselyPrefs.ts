import { deepMergeRecords } from "./deepMerge";
import { normalizeCustomMaskTerms, sanitizeCustomMaskTermsForSave } from "./customMaskTerms";
import {
  DEFAULT_FUSELY_PREFS,
  type CustomMaskTerm,
  type DetectionPrefs,
  type FuselyPrefs,
} from "./types";

/** localStorage キー */
export const FUSELY_PREFS_STORAGE_KEY = "fusely:prefs";

/**
 * 保存済み JSON を型安全な FuselyPrefs に正規化する
 *
 * @param raw - localStorage から読み取ったオブジェクト
 */
export function normalizeFuselyPrefs(raw: Record<string, unknown>): FuselyPrefs {
  const merged = deepMergeRecords(DEFAULT_FUSELY_PREFS as unknown as Record<string, unknown>, raw);

  const detectionRaw = merged.detection;
  const detection: DetectionPrefs = {
    autoDetectFace: readBoolean(
      detectionRaw,
      "autoDetectFace",
      DEFAULT_FUSELY_PREFS.detection.autoDetectFace
    ),
    autoDetectOcr: readBoolean(
      detectionRaw,
      "autoDetectOcr",
      DEFAULT_FUSELY_PREFS.detection.autoDetectOcr
    ),
  };

  const rawVersion =
    typeof merged.version === "number" && Number.isFinite(merged.version)
      ? merged.version
      : DEFAULT_FUSELY_PREFS.version;
  const version = Math.max(rawVersion, DEFAULT_FUSELY_PREFS.version);

  const customMaskTerms = normalizeCustomMaskTerms(merged.customMaskTerms);

  return { version, detection, customMaskTerms };
}

/**
 * localStorage から fusely:prefs を読み込む
 */
export function loadFuselyPrefs(): FuselyPrefs {
  if (typeof window === "undefined") {
    return DEFAULT_FUSELY_PREFS;
  }

  try {
    const raw = window.localStorage.getItem(FUSELY_PREFS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_FUSELY_PREFS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainRecord(parsed)) {
      return DEFAULT_FUSELY_PREFS;
    }
    return normalizeFuselyPrefs(parsed);
  } catch {
    return DEFAULT_FUSELY_PREFS;
  }
}

/**
 * fusely:prefs を localStorage に保存する（既存の未知キーは維持）
 *
 * @param prefs - 保存する設定
 */
export function saveFuselyPrefs(prefs: FuselyPrefs): void {
  if (typeof window === "undefined") {
    return;
  }

  const existing = readRawObject();
  const merged = deepMergeRecords(existing, {
    version: prefs.version,
    detection: {
      autoDetectFace: prefs.detection.autoDetectFace,
      autoDetectOcr: prefs.detection.autoDetectOcr,
    },
    customMaskTerms: prefs.customMaskTerms,
  });

  try {
    window.localStorage.setItem(FUSELY_PREFS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // プライベートモード・容量不足などで保存できない場合は諦める
  }
}

/**
 * detection セクションのみ更新して保存する
 *
 * @param detection - 検出設定
 */
export function saveDetectionPrefs(detection: DetectionPrefs): void {
  const current = loadFuselyPrefs();
  saveFuselyPrefs({
    ...current,
    version: Math.max(current.version, DEFAULT_FUSELY_PREFS.version),
    detection,
  });
}

/**
 * customMaskTerms セクションのみ更新して保存する
 *
 * @param customMaskTerms - マスク語句一覧
 */
export function saveCustomMaskTerms(customMaskTerms: CustomMaskTerm[]): void {
  const current = loadFuselyPrefs();
  saveFuselyPrefs({
    ...current,
    version: Math.max(current.version, DEFAULT_FUSELY_PREFS.version),
    customMaskTerms: sanitizeCustomMaskTermsForSave(customMaskTerms),
  });
}

/**
 * @param value - 検証対象
 */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * localStorage から生オブジェクトを読み取る
 */
function readRawObject(): Record<string, unknown> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(FUSELY_PREFS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return isPlainRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param parent - 親オブジェクト
 * @param key - キー名
 * @param fallback - フォールバック値
 */
function readBoolean(parent: unknown, key: string, fallback: boolean): boolean {
  if (!isPlainRecord(parent)) {
    return fallback;
  }
  return typeof parent[key] === "boolean" ? parent[key] : fallback;
}
