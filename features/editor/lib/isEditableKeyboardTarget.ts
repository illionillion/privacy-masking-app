/**
 * エディタのグローバルショートカットを無効化すべきフォーカス先か
 *
 * 入力系 UI のほか、Space で押下される button / リンク等も対象とする。
 *
 * @param target - keydown 等の event.target
 */
export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
    return true;
  }
  return target.closest("button, a[href], [role='button'], [role='link'], summary") !== null;
}
