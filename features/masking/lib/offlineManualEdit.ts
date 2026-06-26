import type { DetectionPrefs } from "@/lib/preferences";

/** オフライン時に強制する検出設定（自動検出はすべてオフ） */
export const OFFLINE_MANUAL_EDIT_DETECTION_SETTINGS: DetectionPrefs = {
  autoDetectFace: false,
  autoDetectOcr: false,
};

/** オフライン手動編集モードのバナー文言 */
export const OFFLINE_MANUAL_EDIT_BANNER_MESSAGE =
  "オフラインのため手動編集モードです。画像の追加と手動マスキングは利用できますが、自動検出は利用できません。";

/** オフライン時の再検出トースト文言 */
export const OFFLINE_REDETECT_MESSAGE =
  "オフラインのため自動検出は利用できません。手動でマスキングしてください。";

/**
 * オフライン時は自動検出を無効化した検出設定を返す。
 *
 * @param settings - ユーザー設定の検出設定
 * @param isOffline - オフラインかどうか
 */
export function getEffectiveDetectionSettings(
  settings: DetectionPrefs,
  isOffline: boolean
): DetectionPrefs {
  if (!isOffline) {
    return settings;
  }
  return OFFLINE_MANUAL_EDIT_DETECTION_SETTINGS;
}

/**
 * 顔検出モデルの状態によりアップロード等をブロックすべきか。
 *
 * オフライン手動編集モードではモデル未ロード・エラーでもブロックしない。
 *
 * @param isOffline - オフラインかどうか
 * @param isModelLoading - 顔検出モデルロード中か
 * @param isModelError - 顔検出モデルロード失敗か
 */
export function isUploadBlockedByModelState(
  isOffline: boolean,
  isModelLoading: boolean,
  isModelError: boolean
): boolean {
  if (isOffline) {
    return false;
  }
  return isModelLoading || isModelError;
}
