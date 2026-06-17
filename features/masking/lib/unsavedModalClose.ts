import { useConfirmStore } from "@/lib/confirmStore";
import type { CustomMaskTerm, DetectionPrefs } from "@/lib/preferences";

/** 設定モーダルで未保存のまま閉じるときの確認メッセージ */
export const UNSAVED_MODAL_CHANGES_CONFIRM_MESSAGE =
  "変更内容は保存されません。キャンセルしますか？";

/**
 * 検出設定の draft が保存済みと異なるか
 *
 * @param draft - 編集中の設定
 * @param saved - モーダル表示時の保存済み設定
 */
export function hasDetectionSettingsChanges(draft: DetectionPrefs, saved: DetectionPrefs): boolean {
  return (
    draft.autoDetectFace !== saved.autoDetectFace || draft.autoDetectOcr !== saved.autoDetectOcr
  );
}

/**
 * マスク語句の draft が保存済みと異なるか（入力中の未追加テキストも含む）
 *
 * @param draft - 編集中の語句一覧
 * @param saved - モーダル表示時の保存済み語句一覧
 * @param pendingNewTermText - 追加欄に入力中のテキスト
 */
export function hasCustomMaskTermsChanges(
  draft: readonly CustomMaskTerm[],
  saved: readonly CustomMaskTerm[],
  pendingNewTermText = ""
): boolean {
  if (pendingNewTermText.trim().length > 0) {
    return true;
  }
  if (draft.length !== saved.length) {
    return true;
  }
  return draft.some((term, index) => {
    const baseline = saved[index];
    return (
      baseline === undefined ||
      term.id !== baseline.id ||
      term.text !== baseline.text ||
      term.enabled !== baseline.enabled
    );
  });
}

/**
 * 未保存変更があるときだけ確認ダイアログを出してから onClose を呼ぶ
 *
 * @param hasChanges - 未保存の変更があるか
 * @param onClose - モーダルを閉じるコールバック
 */
export async function closeModalWithUnsavedConfirm(
  hasChanges: boolean,
  onClose: () => void
): Promise<void> {
  if (hasChanges) {
    const confirmed = await useConfirmStore.getState().open(UNSAVED_MODAL_CHANGES_CONFIRM_MESSAGE);
    if (!confirmed) {
      return;
    }
  }
  onClose();
}
