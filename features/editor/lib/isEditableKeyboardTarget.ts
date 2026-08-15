/**
 * テキスト入力中のフォーカス先か（button / リンクは含まない）
 *
 * Escape のように、ボタンへフォーカスがある状態でも動作させたい
 * ショートカットのガードに使う。文字入力・IME 変換中の衝突だけを避ける。
 *
 * @param target - keydown 等の event.target
 */
export function isTextInputKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable === true;
}

/**
 * エディタのグローバルショートカットを無効化すべきフォーカス先か
 *
 * 入力系 UI のほか、Space で押下される button / リンク等も対象とする。
 *
 * @param target - keydown 等の event.target
 */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (isTextInputKeyboardTarget(target)) return true;
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("button, a[href], [role='button'], [role='link'], summary") !== null;
}
